<script>
	import StockTab from '$lib/components/StockTab.svelte';
	import CustomersTab from '$lib/components/CustomersTab.svelte';
	import DashboardTab from '$lib/components/DashboardTab.svelte';
	import AuthSplash from '$lib/components/AuthSplash.svelte';

	let activeTab = $state('dashboard');
</script>

<AuthSplash>
	<div class="mobile-container">
	<header class="header">
		<img src="/logos/logo-dazzle-logotype.png" alt="Dazzle" class="header-logo" />
	</header>

	<main class="tab-content">
		{#if activeTab === 'stock'}
			<StockTab />
		{:else if activeTab === 'customers'}
			<CustomersTab />
		{:else if activeTab === 'dashboard'}
			<DashboardTab />
		{/if}
	</main>

	<nav class="bottom-nav">
		<button
			class:active={activeTab === 'stock'}
			onclick={() => (activeTab = 'stock')}
			aria-label="Stock"
		>
			<img src="/icons/icon-stock.svg" alt="" class="nav-icon" />
		</button>
		<button
			class:active={activeTab === 'dashboard'}
			onclick={() => (activeTab = 'dashboard')}
			aria-label="Dashboard"
		>
			<img src="/icons/icon-dashboard.svg" alt="" class="nav-icon" />
		</button>
		<button
			class:active={activeTab === 'customers'}
			onclick={() => (activeTab = 'customers')}
			aria-label="Orders"
		>
			<img src="/icons/icon-customers.svg" alt="" class="nav-icon" />
		</button>
	</nav>
	</div>
</AuthSplash>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #f5f5f5;
	}

	.mobile-container {
		max-width: 480px;
		margin: 0 auto;
		background: white;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
	}

	.header {
		background: white;
		padding: 14px 20px 5px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-logo {
		height: 48px;
		width: auto;
	}

	.tab-content {
		flex: 1;
		overflow-y: auto;
		padding-bottom: 56px;
	}

	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		max-width: 480px;
		margin: 0 auto;
		display: flex;
		border-top: 1px solid #eee;
		background: white;
		height: 56px;
		z-index: 100;
	}

	.bottom-nav button {
		flex: 1;
		border: none;
		background: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.bottom-nav .nav-icon {
		width: 28px;
		height: 28px;
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	.bottom-nav button.active .nav-icon {
		opacity: 1;
		filter: brightness(0) saturate(100%) invert(12%) sepia(95%) saturate(5946%) hue-rotate(318deg) brightness(78%) contrast(108%);
	}

	@media (max-width: 480px) {
		.mobile-container {
			border-radius: 0;
			box-shadow: none;
		}
	}
</style>
