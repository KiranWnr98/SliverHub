import { useEffect, useState } from 'react';

import type { ProductMediaReference } from '../types';
import {
  getProductMediaFile,
  productImageMediaId,
} from '../services/productMediaStore';

export interface ResolvedProductMedia {
  id: string;
  name: string;
  kind: 'image' | 'video';
  url: string;
}

/** Loads an IndexedDB-backed media file and exposes a temporary object URL. */
export function useProductMediaUrl(mediaId: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    setUrl(null);

    if (!mediaId) {
      return () => {
        active = false;
      };
    }

    void getProductMediaFile(mediaId)
      .then((file) => {
        if (!file) {
          throw new Error(`Media file "${mediaId}" is missing.`);
        }

        objectUrl = URL.createObjectURL(file);

        if (active) {
          setUrl(objectUrl);
        } else {
          // The component or media ID changed while IndexedDB was loading.
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
      })
      .catch((error: unknown) => {
        if (active) {
          console.error('Unable to load product media.', error);
        }
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };
  }, [mediaId]);

  return url;
}

/** Resolves an image URL, including images stored in IndexedDB. */
export function useProductImage(image: string): string | null {
  const mediaId = productImageMediaId(image);
  const mediaUrl = useProductMediaUrl(mediaId);
  return mediaId ? mediaUrl : image;
}

/**
 * Resolves product gallery images and MP4 videos while excluding supporting
 * PDFs. IndexedDB object URLs are revoked when the gallery changes or unmounts.
 */
export function useProductGallery(
  media: ProductMediaReference[] | undefined,
): ResolvedProductMedia[] {
  const [items, setItems] = useState<ResolvedProductMedia[]>([]);

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];

    // Do not keep showing the previous product's gallery while the next loads.
    setItems([]);

    const loadMedia = async () => {
      const galleryReferences = (media ?? []).filter(
        (reference): reference is ProductMediaReference & { kind: 'image' | 'video' } =>
          reference.kind === 'image' || reference.kind === 'video',
      );

      const resolved = await Promise.all(
        galleryReferences.map(
          async (reference): Promise<ResolvedProductMedia | null> => {
            try {
              if (reference.storage === 'url') {
                return reference.url
                  ? {
                      id: reference.id,
                      name: reference.name,
                      kind: reference.kind,
                      url: reference.url,
                    }
                  : null;
              }

              const file = await getProductMediaFile(reference.id);
              if (!file) {
                console.error(`Missing product ${reference.kind}: ${reference.name}`);
                return null;
              }

              const objectUrl = URL.createObjectURL(file);

              // The effect may have been cleaned up while IndexedDB was loading.
              if (!active) {
                URL.revokeObjectURL(objectUrl);
                return null;
              }

              objectUrls.push(objectUrl);
              return {
                id: reference.id,
                name: reference.name,
                kind: reference.kind,
                url: objectUrl,
              };
            } catch (error) {
              console.error(
                `Unable to load product ${reference.kind}: ${reference.name}`,
                error,
              );
              return null;
            }
          },
        ),
      );

      if (active) {
        setItems(
          resolved.filter(
            (item): item is ResolvedProductMedia => item !== null,
          ),
        );
      }
    };

    void loadMedia();

    return () => {
      active = false;
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [media]);

  return items;
}
