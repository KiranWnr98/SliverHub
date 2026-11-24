
import type { ProductMediaReference } from '../types';

const DATABASE_NAME = 'silverhub-product-media';
const DATABASE_VERSION = 1;
const FILE_STORE = 'files';
const PRODUCT_IMAGE_PREFIX = 'indexeddb:';

interface StoredMediaFile {
  id: string;
  file: Blob;
}

let databasePromise: Promise<IDBDatabase> | null = null;
const pendingMediaIds = new Set<string>();

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(
      new Error(
        'IndexedDB is unavailable; product media cannot be stored locally.',
      ),
    );
  }

  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(FILE_STORE)) {
        request.result.createObjectStore(FILE_STORE, {
          keyPath: 'id',
        });
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () => {
      databasePromise = null;
      reject(
        request.error ??
          new Error('Unable to open the product media store.'),
      );
    };

    request.onblocked = () => {
      databasePromise = null;
      reject(
        new Error(
          'The product media store is blocked by another browser connection.',
        ),
      );
    };
  });

  return databasePromise;
}

function transactionError(transaction: IDBTransaction): Error {
  return (
    transaction.error ??
    new Error('The product media transaction failed.')
  );
}

/**
 * Saves an image, PDF, or video file in IndexedDB.
 *
 * Files are stored as Blob objects, so MP4 videos do not
 * require a separate database or schema migration.
 */
export async function saveProductMediaFile(
  id: string,
  file: File,
): Promise<void> {
  pendingMediaIds.add(id);

  try {
    const database = await openDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(
        FILE_STORE,
        'readwrite',
      );

      transaction
        .objectStore(FILE_STORE)
        .put({ id, file } satisfies StoredMediaFile);

      transaction.oncomplete = () => resolve();

      transaction.onerror = () => {
        reject(transactionError(transaction));
      };

      transaction.onabort = () => {
        reject(transactionError(transaction));
      };
    });
  } catch (error) {
    pendingMediaIds.delete(id);
    throw error;
  }
}

/**
 * Retrieves an image, PDF, or video Blob from IndexedDB.
 */
export async function getProductMediaFile(
  id: string,
): Promise<Blob | undefined> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      FILE_STORE,
      'readonly',
    );

    const request = transaction.objectStore(FILE_STORE).get(id);

    request.onsuccess = () => {
      const record = request.result as StoredMediaFile | undefined;
      resolve(record?.file);
    };

    request.onerror = () => {
      reject(
        request.error ?? transactionError(transaction),
      );
    };
  });
}

/**
 * Deletes selected media files.
 */
export async function deleteProductMediaFiles(
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;

  ids.forEach((id) => pendingMediaIds.delete(id));

  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      FILE_STORE,
      'readwrite',
    );

    const store = transaction.objectStore(FILE_STORE);

    for (const id of ids) {
      store.delete(id);
    }

    transaction.oncomplete = () => resolve();

    transaction.onerror = () => {
      reject(transactionError(transaction));
    };

    transaction.onabort = () => {
      reject(transactionError(transaction));
    };
  });
}

/**
 * Removes media files that are no longer referenced by products.
 *
 * Pending uploads are protected from accidental cleanup.
 */
export async function pruneUnusedProductMedia(
  references: ProductMediaReference[],
): Promise<void> {
  if (typeof indexedDB === 'undefined') return;

  const database = await openDatabase();

  const retainedIds = new Set(
    references
      .filter(
        (reference) => reference.storage === 'indexeddb',
      )
      .map((reference) => reference.id),
  );

  for (const id of retainedIds) {
    pendingMediaIds.delete(id);
  }

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(
      FILE_STORE,
      'readwrite',
    );

    const store = transaction.objectStore(FILE_STORE);
    const request = store.getAllKeys();

    request.onsuccess = () => {
      for (const key of request.result) {
        if (
          typeof key === 'string' &&
          !retainedIds.has(key) &&
          !pendingMediaIds.has(key)
        ) {
          store.delete(key);
        }
      }
    };

    request.onerror = () => {
      reject(
        request.error ?? transactionError(transaction),
      );
    };

    transaction.oncomplete = () => resolve();

    transaction.onerror = () => {
      reject(transactionError(transaction));
    };

    transaction.onabort = () => {
      reject(transactionError(transaction));
    };
  });
}

/**
 * Creates an IndexedDB image reference.
 */
export function productImageReference(id: string): string {
  return `${PRODUCT_IMAGE_PREFIX}${id}`;
}

/**
 * Extracts the IndexedDB media ID from an image reference.
 */
export function productImageMediaId(
  image: string,
): string | null {
  return image.startsWith(PRODUCT_IMAGE_PREFIX)
    ? image.slice(PRODUCT_IMAGE_PREFIX.length)
    : null;
}
