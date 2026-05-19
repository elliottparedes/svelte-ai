export type MicCheckResult =
	| { ok: true }
	| { ok: false; message: string };

/** Optional warmup; speech can still work if this fails but permission was granted earlier. */
export async function checkMicrophoneAccess(): Promise<MicCheckResult> {
	if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
		return { ok: false, message: 'Microphone API not available in this browser' };
	}

	if (navigator.permissions?.query) {
		try {
			const status = await navigator.permissions.query({
				name: 'microphone' as PermissionName
			});
			if (status.state === 'denied') {
				return {
					ok: false,
					message: 'Microphone blocked in browser settings — reset permission for this site'
				};
			}
		} catch {
			/* permissions query unsupported */
		}
	}

	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		for (const t of stream.getTracks()) t.stop();
		return { ok: true };
	} catch (e) {
		const name = e instanceof DOMException ? e.name : '';
		if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
			return {
				ok: false,
				message: 'Microphone blocked — click 🎤 below or allow mic in the address bar'
			};
		}
		if (name === 'NotFoundError') {
			return { ok: false, message: 'No microphone found on this device' };
		}
		return { ok: false, message: 'Could not open microphone' };
	}
}
