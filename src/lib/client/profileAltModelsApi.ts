export async function saveAltModelPreferences(enabledIds: readonly string[]): Promise<void> {
	const res = await fetch('/api/v1/profile/alt-models', {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ enabledIds })
	});
	if (!res.ok) throw new Error('Save failed');
}
