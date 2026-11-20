import { useEffect, useState } from 'react';

import { getProductMediaFile, productImageMediaId } from '../services/productMediaStore';

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
          throw new Error(`The locally stored media file "${mediaId}" is missing.`);
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
          console.error('Unable to load a locally stored product media file.', error);
        }
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaId]);

  return url;
}

export function useProductImage(image: string): string | null {
  const mediaUrl = useProductMediaUrl(productImageMediaId(image));
  return productImageMediaId(image) ? mediaUrl : image;
}

