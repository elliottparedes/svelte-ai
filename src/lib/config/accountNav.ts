export interface AccountNavItem {
	href: string;
	label: string;
	icon?: string;
}

export const accountNavItems: AccountNavItem[] = [
	{ href: '/profile', label: 'Profile' }
];
