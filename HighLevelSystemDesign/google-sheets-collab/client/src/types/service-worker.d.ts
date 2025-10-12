// Add Background Sync interface
interface SyncManager {
	register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistration {
	sync: SyncManager;
}

export {};
