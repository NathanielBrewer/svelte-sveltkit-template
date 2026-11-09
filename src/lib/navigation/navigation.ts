export type NavigationItem = {
	label: string;
	href: string;
	children?: NavigationItem[];
};

export function normalizePath(path: string): string {
	return path.replace(/\/+$/, '') || '/';
}

export function isCurrentPath(href: string, pathname: string): boolean {
	return normalizePath(href) === normalizePath(pathname);
}

export function isActiveItem(item: NavigationItem, pathname: string): boolean {
	const target = normalizePath(item.href);
	const path = normalizePath(pathname);
	return (
		path === target ||
		(target !== '/' && path.startsWith(`${target}/`)) ||
		(item.children?.some((child) => isActiveItem(child, path)) ?? false)
	);
}
