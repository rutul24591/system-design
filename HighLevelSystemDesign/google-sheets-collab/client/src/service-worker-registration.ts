/**
 * Service Worker Registration and Offline Support
 *
 * This module provides:
 * 1. Service Worker registration for offline capabilities
 * 2. Update handling and notification
 * 3. IndexedDB setup for offline data storage
 * 4. Background sync registration for pending updates
 */

// Check if service workers are supported
if ('serviceWorker' in navigator) {
	window.addEventListener('load', async () => {
		try {
			const registration = await navigator.serviceWorker.register(
				'/service-worker.ts',
				{
					scope: '/',
				},
			);

			// Optional: Handle service worker lifecycle events
			registration.addEventListener('install', (event: Event) => {
				console.log('Service worker installed:', event);
			});

			registration.addEventListener('activate', (event: Event) => {
				console.log('Service worker activated:', event);
			});

			// Handle updates found
			registration.addEventListener('updatefound', () => {
				const newWorker = registration.installing;
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (
							newWorker.state === 'installed' &&
							navigator.serviceWorker.controller
						) {
							// New update is available
							if (confirm('New version available! Would you like to update?')) {
								newWorker.postMessage({ type: 'SKIP_WAITING' });
								window.location.reload();
							}
						}
					});
				}
			});

			// Handle controller change
			let refreshing = false;
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				if (!refreshing) {
					window.location.reload();
					refreshing = true;
				}
			});
		} catch (error) {
			console.error('Service worker registration failed:', error);
		}
	});
}

/**
 * Stores cell updates in IndexedDB when offline
 *
 * This function:
 * 1. Checks for active service worker
 * 2. Opens IndexedDB connection
 * 3. Stores update with timestamp
 * 4. Registers background sync
 *
 * @param update - Cell update object containing row, col, value, and format
 * @throws Error if service worker is not active
 */
export async function storePendingUpdate(update: any) {
	if (!navigator.serviceWorker.controller) {
		throw new Error('Service worker is not active');
	}

	const db = await openDB();
	const transaction = db.transaction('pending-updates', 'readwrite');
	const store = transaction.objectStore('pending-updates');
	await store.add({
		...update,
		id: Date.now().toString(),
		timestamp: Date.now(),
	});

	// Trigger background sync
	try {
		const registration = await navigator.serviceWorker.ready;
		await registration?.sync.register('cell-update');
	} catch (error) {
		console.error('Background sync registration failed:', error);
	}
}

/**
 * Opens or creates the IndexedDB database for offline storage
 *
 * This function:
 * 1. Opens connection to IndexedDB
 * 2. Creates 'pending-updates' object store if needed
 * 3. Handles database versioning
 *
 * @returns Promise resolving to IDBDatabase instance
 */
async function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('sheets-offline', 1);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains('pending-updates')) {
				db.createObjectStore('pending-updates', { keyPath: 'id' });
			}
		};
	});
}
