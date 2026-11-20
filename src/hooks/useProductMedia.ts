
import { useEffect, useState } from 'react';

import type { ProductMediaReference } from '../types';
import {
  getProductMediaFile,
  productImageMediaId,
} from '../services/productMediaStore';

export interface ResolvedProductImage {
  id: string;
  name: string;
  url: string;
}

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
          URL.revokeObjectURL(objectUrl);
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
      }
    };
  }, [mediaId]);

  return url;
}

export function useProductImage(image: string): string | null {
  const mediaUrl = useProductMediaUrl(productImageMediaId(image));

  return productImageMediaId(image) ? mediaUrl : image;
}

export function useProductGallery(
  media: ProductMediaReference[] | undefined,
): ResolvedProductImage[] {
  const [images, setImages] = useState<ResolvedProductImage[]>([]);

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];

    const loadImages = async () => {
      const imageReferences = (media ?? []).filter(
        (reference) => reference.kind === 'image',
      );

      const resolved = await Promise.all(
        imageReferences.map(async (reference) => {
          try {
            if (reference.storage === 'url') {
              return reference.url
                ? {
                    id: reference.id,
                    name: reference.name,
                    url: reference.url,
                  }
                : null;
            }

            const file = await getProductMediaFile(reference.id);

            if (!file) {
              console.error(`Missing product image: ${reference.name}`);
              return null;
            }

            const objectUrl = URL.createObjectURL(file);
            objectUrls.push(objectUrl);

            return {
              id: reference.id,
              name: reference.name,
              url: objectUrl,
            };
          } catch (error) {
            console.error(
              `Unable to load product image: ${reference.name}`,
              error,
            );
            return null;
          }
        }),
      );

      if (active) {
        setImages(
          resolved.filter(
            (image): image is ResolvedProductImage => image !== null,
          ),
        );
      }
    };

    void loadImages();

    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [media]);

  return images;
}
