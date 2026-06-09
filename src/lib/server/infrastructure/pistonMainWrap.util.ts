const SANDBOX_IMPORTS = `from inkstream_sandbox import (
    inkstream_read_csv, inkstream_show, inkstream_profile, inkstream_group_means, preloaded_banner,
    read_csv, show, profile, group_means,
)`;

/** Wrap user code with sandbox imports and optional attachment banner. */
export function wrapPistonMainPy(
	userCode: string,
	dataFiles: readonly { name: string }[]
): string {
	const imports = SANDBOX_IMPORTS;
	if (!dataFiles.length) {
		return `${imports}\n\n${userCode}`;
	}
	const names = dataFiles.map((f) => f.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
	const list = names.map((n) => `'${n}'`).join(', ');
	return `${imports}

preloaded_banner([${list}])

${userCode}`;
}
