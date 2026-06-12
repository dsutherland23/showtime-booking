'use client';

import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
	// Safe context check to prevent hydration crash if ThemeProvider is absent/deferred
	const themeContext = useTheme();
	const theme = themeContext ? themeContext.theme : 'light';

	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<{
		scene: THREE.Scene;
		camera: THREE.PerspectiveCamera;
		renderer: THREE.WebGLRenderer;
		particles: THREE.Points[];
		animationId: number;
		count: number;
	} | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		let animationId: number = 0;
		let renderer: THREE.WebGLRenderer | null = null;
		let scene: THREE.Scene | null = null;
		let points: THREE.Points | null = null;
		let resizeObserver: ResizeObserver | null = null;

		try {
			const SEPARATION = 150;
			const AMOUNTX = 40;
			const AMOUNTY = 60;

			// Scene setup
			scene = new THREE.Scene();
			// Fog color matches the Apple dark promotional band #1d1d1f for premium seamless blending
			scene.fog = new THREE.Fog(0x1d1d1f, 2000, 10000);

			const width = containerRef.current.clientWidth || window.innerWidth;
			const height = containerRef.current.clientHeight || 300;

			const camera = new THREE.PerspectiveCamera(
				60,
				width / height,
				1,
				10000,
			);
			camera.position.set(0, 355, 1220);
			camera.lookAt(0, 0, 0);

			renderer = new THREE.WebGLRenderer({
				alpha: true,
				antialias: true,
			});
			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.setSize(width, height);
			renderer.setClearColor(scene.fog.color, 0);

			containerRef.current.appendChild(renderer.domElement);

			// Create particles
			const positions: number[] = [];
			const colors: number[] = [];

			// Create geometry for all particles
			const geometry = new THREE.BufferGeometry();

			for (let ix = 0; ix < AMOUNTX; ix++) {
				for (let iy = 0; iy < AMOUNTY; iy++) {
					const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
					const y = 0; // Will be animated
					const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

					positions.push(x, y, z);
					
					// Standard normalized float colors in Three.js (0.0 to 1.0)
					if (theme === 'dark') {
						colors.push(0.8, 0.8, 0.8); // Light gray dots
					} else {
						// Since this is primarily integrated on the dark promotional band,
						// we default to a soft glowing light blue-gray so it stands out beautifully.
						colors.push(0.6, 0.75, 0.9);
					}
				}
			}

			geometry.setAttribute(
				'position',
				new THREE.Float32BufferAttribute(positions, 3),
			);
			geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

			// Create material
			const material = new THREE.PointsMaterial({
				size: 12,
				vertexColors: true,
				transparent: true,
				opacity: 0.8,
				sizeAttenuation: true,
			});

			// Create points object
			points = new THREE.Points(geometry, material);
			scene.add(points);

			let count = 0;

			// Animation function
			const animate = () => {
				animationId = requestAnimationFrame(animate);

				const positionAttribute = geometry.attributes.position;
				const positions = positionAttribute.array as Float32Array;

				let i = 0;
				for (let ix = 0; ix < AMOUNTX; ix++) {
					for (let iy = 0; iy < AMOUNTY; iy++) {
						const index = i * 3;

						// Animate Y position with sine waves
						positions[index + 1] =
							Math.sin((ix + count) * 0.3) * 50 +
							Math.sin((iy + count) * 0.5) * 50;

						i++;
					}
				}

				positionAttribute.needsUpdate = true;

				if (renderer && scene) {
					renderer.render(scene, camera);
				}
				count += 0.1;
			};

			// Handle resize via ResizeObserver
			resizeObserver = new ResizeObserver((entries) => {
				if (!entries || !entries.length) return;
				const entry = entries[0];
				const target = entry.target as HTMLElement;
				const width = entry.contentRect.width || target.clientWidth || window.innerWidth;
				const height = entry.contentRect.height || target.clientHeight || 300;

				camera.aspect = width / height;
				camera.updateProjectionMatrix();
				if (renderer) {
					renderer.setSize(width, height);
				}
			});

			resizeObserver.observe(containerRef.current);

			// Start animation
			animate();

			// Store references
			sceneRef.current = {
				scene,
				camera,
				renderer,
				particles: [points],
				animationId,
				count,
			};
		} catch (error) {
			// Catch WebGL context support issues and fail silently on headless environments
			console.warn('WebGL is not supported or failed to initialize in DottedSurface:', error);
		}

		// Cleanup function
		return () => {
			if (resizeObserver) {
				resizeObserver.disconnect();
			}

			if (animationId) {
				cancelAnimationFrame(animationId);
			}

			try {
				if (points) {
					points.geometry.dispose();
					if (Array.isArray(points.material)) {
						points.material.forEach((material) => material.dispose());
					} else {
						points.material.dispose();
					}
				}
				if (renderer) {
					renderer.dispose();
					if (containerRef.current && renderer.domElement) {
						containerRef.current.removeChild(renderer.domElement);
					}
				}
			} catch (e) {
				console.error('Error during DottedSurface WebGL cleanups:', e);
			}
		};
	}, [theme]);

	return (
		<div
			ref={containerRef}
			className={cn('pointer-events-none fixed inset-0 z-[-1]', className)}
			{...props}
		/>
	);
}
