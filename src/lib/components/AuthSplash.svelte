<script>
	import { onMount } from 'svelte';

	let isAuthenticated = $state(false);
	let showPinEntry = $state(false);
	let pinInput = $state('');
	let bioDevice = $state('');
	let errorMessage = $state('');
	let isFirstTime = $state(false);

	const PIN_KEY = 'dazzle_pin_hash';
	const AUTH_KEY = 'dazzle_authenticated';
	const PASSKEY_KEY = 'dazzle_passkey';

	onMount(() => {
		// Check if already authenticated in this session
		const sessionAuth = sessionStorage.getItem(AUTH_KEY);
		if (sessionAuth === 'true') {
			isAuthenticated = true;
			return;
		}

		// Check if user has set up biometric or PIN
		const savedPin = localStorage.getItem(PIN_KEY);
		const savedPasskey = localStorage.getItem(PASSKEY_KEY);

		isFirstTime = !savedPin && !savedPasskey;

		// Detect available biometric
		detectBioDevice();
	});

	function detectBioDevice() {
		if (window.PublicKeyCredential) {
			PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(
				(available) => {
					if (available) {
						// Detect device type based on user agent
						const ua = navigator.userAgent;
						if (ua.includes('iPhone') || ua.includes('iPad')) {
							bioDevice = 'Face ID';
						} else if (ua.includes('Mac')) {
							bioDevice = 'Touch ID';
						} else if (ua.includes('Windows')) {
							bioDevice = 'Windows Hello';
						} else if (ua.includes('Android')) {
							bioDevice = 'Fingerprint';
						} else {
							bioDevice = 'Biometric';
						}
					}
				}
			);
		}
	}

	function simpleHash(str) {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return Math.abs(hash).toString(16);
	}

	async function handleBioUnlock() {
		errorMessage = '';
		try {
			const savedPasskey = localStorage.getItem(PASSKEY_KEY);

			if (!savedPasskey && !isFirstTime) {
				// User hasn't set up biometric yet, try PIN instead
				showPinEntry = true;
				return;
			}

			if (isFirstTime) {
				// First time: register biometric
				await registerBiometric();
			} else {
				// Unlock with biometric
				await unlockWithBiometric();
			}
		} catch (err) {
			errorMessage = 'Biometric failed. Try PIN instead.';
			showPinEntry = true;
		}
	}

	async function registerBiometric() {
		const challenge = new Uint8Array(32);
		crypto.getRandomValues(challenge);

		const credential = await navigator.credentials.create({
			publicKey: {
				challenge,
				rp: { name: 'Dazzle by Dorah' },
				user: {
					id: new Uint8Array(16),
					name: 'dazzle_user',
					displayName: 'Dazzle User'
				},
				pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
				authenticatorSelection: {
					authenticatorAttachment: 'platform',
					userVerification: 'preferred'
				},
				timeout: 60000
			}
		});

		if (credential) {
			localStorage.setItem(PASSKEY_KEY, JSON.stringify(credential.id));
			sessionStorage.setItem(AUTH_KEY, 'true');
			isAuthenticated = true;
		}
	}

	async function unlockWithBiometric() {
		const challenge = new Uint8Array(32);
		crypto.getRandomValues(challenge);

		const credential = await navigator.credentials.get({
			publicKey: {
				challenge,
				timeout: 60000,
				userVerification: 'preferred'
			}
		});

		if (credential) {
			sessionStorage.setItem(AUTH_KEY, 'true');
			isAuthenticated = true;
		}
	}

	function handlePinEntry(e) {
		const value = e.target.value.replace(/\D/g, '').slice(0, 4);
		pinInput = value;

		// Auto-submit on 4 digits with small delay
		if (value.length === 4) {
			setTimeout(() => {
				verifyPin();
			}, 300);
		}
	}

	function verifyPin() {
		errorMessage = '';

		if (pinInput.length !== 4) {
			errorMessage = 'Enter 4 digits';
			return;
		}

		const hash = simpleHash(pinInput);
		const savedHash = localStorage.getItem(PIN_KEY);

		if (isFirstTime) {
			// First time: save PIN
			localStorage.setItem(PIN_KEY, hash);
			sessionStorage.setItem(AUTH_KEY, 'true');
			isAuthenticated = true;
		} else {
			// Verify PIN
			if (hash === savedHash) {
				sessionStorage.setItem(AUTH_KEY, 'true');
				isAuthenticated = true;
			} else {
				errorMessage = 'Wrong PIN';
				pinInput = '';
			}
		}
	}

	function togglePinEntry() {
		showPinEntry = !showPinEntry;
		errorMessage = '';
		pinInput = '';
	}
</script>

{#if !isAuthenticated}
	<div class="splash-screen">
		<div class="splash-content">
			<img src="/logos/logo-dazzle-maskable.png" alt="Dazzle" class="splash-logo" />

			{#if !showPinEntry}
				<div class="unlock-section">
					{#if bioDevice}
						<button class="bio-button" onclick={handleBioUnlock}>
							Unlock with {bioDevice} <span class="chevron">›</span>
						</button>
					{/if}

					<button class="pin-toggle" onclick={togglePinEntry}>
						Or use PIN
					</button>
				</div>
			{:else}
				<div class="pin-section">
					<p class="pin-label">Enter PIN</p>
					<input
						type="text"
						inputmode="numeric"
						placeholder="0000"
						value={pinInput}
						onchange={handlePinEntry}
						oninput={handlePinEntry}
						maxlength="4"
						class="pin-input"
					/>
					{#if errorMessage}
						<p class="error-message">{errorMessage}</p>
					{/if}
					{#if bioDevice}
						<button class="back-button" onclick={togglePinEntry}>
							Use {bioDevice}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<slot />
{/if}

<style>
	.splash-screen {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--dazzle);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	@media (min-width: 481px) {
		.splash-screen {
			max-width: 480px;
			margin: 0 auto;
		}
	}

	.splash-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		padding: 40px 20px;
		position: relative;
	}

	.splash-logo {
		width: 280px;
		height: 280px;
		margin-bottom: auto;
		margin-top: auto;
	}

	.unlock-section,
	.pin-section {
		margin-top: auto;
		margin-bottom: auto;
		width: 100%;
		text-align: center;
	}

	.bio-button {
		width: 100%;
		background: none;
		border: none;
		color: white;
		font-size: var(--font-body);
		font-weight: 600;
		cursor: pointer;
		padding: 12px 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: opacity 0.2s;
	}

	.bio-button:active {
		opacity: 0.8;
	}

	.chevron {
		font-size: 20px;
		opacity: 0.8;
	}

	.pin-toggle {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		font-size: var(--font-body);
		cursor: pointer;
		padding: 12px 0;
		transition: color 0.2s;
	}

	.pin-toggle:active {
		color: white;
	}

	.pin-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.pin-label {
		color: rgba(255, 255, 255, 0.7);
		font-size: var(--font-body);
		font-weight: 400;
		margin: 0 0 8px 0;
	}

	.pin-input {
		width: 120px;
		padding: 12px 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		background: #f5e8f0;
		font-size: 24px;
		font-weight: 700;
		color: var(--dazzle);
		text-align: center;
		letter-spacing: 4px;
		font-family: 'Inter', monospace;
		transition: border-color 0.2s;
		margin: 0 auto;
	}

	.pin-input:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.6);
	}

	.pin-input::placeholder {
		color: rgba(170, 1, 113, 0.3);
	}

	.error-message {
		color: var(--dazzle-light);
		font-size: var(--font-helper);
		margin: 12px 0 0 0;
		font-weight: 500;
	}

	.back-button {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		font-size: var(--font-body);
		cursor: pointer;
		padding: 12px 0;
		margin-top: 16px;
		transition: color 0.2s;
	}

	.back-button:active {
		color: white;
	}
</style>
