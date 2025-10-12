/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

// Precache all assets specified in the manifest
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses
registerRoute(
	({ url }) => url.pathname.startsWith('/api/'),
	new StaleWhileRevalidate({
		cacheName: 'api-cache',
		plugins: [
			new CacheableResponsePlugin({
				statuses: [0, 200],
			}),
			new ExpirationPlugin({
				maxEntries: 100,
				maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
			}),
		],
	}),
);

// Cache static assets
registerRoute(
	({ request }) =>
		request.destination === 'style' ||
		request.destination === 'script' ||
		request.destination === 'font',
	new CacheFirst({
		cacheName: 'static-resources',
		plugins: [
			new CacheableResponsePlugin({
				statuses: [0, 200],
			}),
			new ExpirationPlugin({
				maxEntries: 60,
				maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
			}),
		],
	}),
);

// Background sync for offline cell updates
self.addEventListener('sync', (event) => {
	if (event.tag === 'cell-update') {
		event.waitUntil(syncCellUpdates());
	}
});

async function syncCellUpdates() {
	const pendingUpdates = await getPendingUpdates();
	for (const update of pendingUpdates) {
		try {
			await fetch('/api/sheets/cell-update', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(update),
			});
			await removePendingUpdate(update.id);
		} catch (error) {
			console.error('Failed to sync update:', error);
		}
	}
}

// IndexedDB helpers for storing pending updates
const DB_NAME = 'sheets-offline';
const STORE_NAME = 'pending-updates';

async function openDB() {
	return new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			db.createObjectStore(STORE_NAME, { keyPath: 'id' });
		};
	});
}

async function getPendingUpdates() {
	const db = await openDB();
	return new Promise<any[]>((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.getAll();
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
	});
}

async function removePendingUpdate(id: string) {
	const db = await openDB();
	return new Promise<void>((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.delete(id);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

// Handle messages from the client
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
