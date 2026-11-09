// Adapted from agent-orchestration/apps/web/scripts/check-accessibility.mjs.
export async function renderedContrastFailures(page, selector, state) {
	return page.$$eval(
		selector,
		(elements, stateName) => {
			const canvas = globalThis.document.createElement('canvas');
			canvas.width = 1;
			canvas.height = 1;
			const context = canvas.getContext('2d', { willReadFrequently: true });
			if (!context) throw new Error('Canvas is unavailable for rendered contrast checks');

			const color = (value) => {
				context.clearRect(0, 0, 1, 1);
				context.fillStyle = 'rgba(0, 0, 0, 0)';
				context.fillRect(0, 0, 1, 1);
				context.fillStyle = value;
				context.fillRect(0, 0, 1, 1);
				const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
				return [red, green, blue, alpha / 255];
			};
			const composite = (foreground, background) => {
				const alpha = foreground[3] + background[3] * (1 - foreground[3]);
				if (alpha === 0) return [0, 0, 0, 0];
				return [
					(foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) /
						alpha,
					(foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) /
						alpha,
					(foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) /
						alpha,
					alpha
				];
			};
			const effectiveBackground = (element) => {
				const layers = [];
				for (let current = element; current; current = current.parentElement) {
					layers.push(color(globalThis.getComputedStyle(current).backgroundColor));
				}
				return layers
					.reverse()
					.reduce((background, layer) => composite(layer, background), [255, 255, 255, 1]);
			};
			const linear = (channel) => {
				const normalized = channel / 255;
				return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
			};
			const luminance = ([red, green, blue]) =>
				linear(red) * 0.2126 + linear(green) * 0.7152 + linear(blue) * 0.0722;
			const ratio = (foreground, background) => {
				const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
				return (values[0] + 0.05) / (values[1] + 0.05);
			};

			return elements.flatMap((element) => {
				const background = effectiveBackground(element);
				const style = globalThis.getComputedStyle(element);
				const foreground = composite(color(style.color), background);
				const measured = ratio(foreground, background);
				return measured >= 4.5
					? []
					: [
							{
								label:
									element.getAttribute('data-contrast-label') ||
									element.id ||
									element.textContent?.trim() ||
									element.tagName.toLowerCase(),
								ratio: measured,
								state: stateName,
								foreground: style.color,
								background: style.backgroundColor
							}
						];
			});
		},
		state
	);
}
