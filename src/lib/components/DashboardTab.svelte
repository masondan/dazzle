<script>
	import { ordersStore } from '$lib/stores/orders.svelte.js';
	import { inventoryStore } from '$lib/stores/inventory.svelte.js';
	import { suppliersStore } from '$lib/stores/suppliers.svelte.js';
	import { costsStore } from '$lib/stores/costs.svelte.js';
	import CostForm from './CostForm.svelte';
	import SupplierForm from './SupplierForm.svelte';

	let dateRange = $state('7');
	let customFrom = $state('');
	let customTo = $state('');
	let showDatePicker = $state(false);
	let openSection = $state(null);
	let showCostForm = $state(false);
	let editingCost = $state(null);
	let showSupplierForm = $state(false);
	let editingSupplier = $state(null);
	let deleteConfirm = $state(null);
	let toastMessage = $state('');

	function toggleSection(name) {
		openSection = openSection === name ? null : name;
	}

	function showToast(msg) {
		toastMessage = msg;
		setTimeout(() => { toastMessage = ''; }, 2500);
	}

	function parseDate(dateStr) {
		if (!dateStr) return null;
		if (dateStr.includes('-')) return new Date(dateStr + 'T00:00:00');
		const parts = dateStr.split('/');
		if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
		return null;
	}

	function daysAgo(n) {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		d.setDate(d.getDate() - n);
		return d;
	}

	let dateFilteredOrders = $derived.by(() => {
		let from, to;
		if (dateRange === 'custom') {
			from = customFrom ? new Date(customFrom + 'T00:00:00') : null;
			to = customTo ? new Date(customTo + 'T23:59:59') : null;
		} else {
			const days = parseInt(dateRange);
			from = daysAgo(days);
			to = new Date();
		}

		return ordersStore.orders.filter(o => {
			const d = parseDate(o.date);
			if (!d) return false;
			if (from && d < from) return false;
			if (to && d > to) return false;
			return true;
		});
	});

	let dateFilteredCosts = $derived.by(() => {
		let from, to;
		if (dateRange === 'custom') {
			from = customFrom ? new Date(customFrom + 'T00:00:00') : null;
			to = customTo ? new Date(customTo + 'T23:59:59') : null;
		} else {
			const days = parseInt(dateRange);
			from = daysAgo(days);
			to = new Date();
		}

		return costsStore.costs.filter(c => {
			const d = parseDate(c.date);
			if (!d) return false;
			if (from && d < from) return false;
			if (to && d > to) return false;
			return true;
		});
	});

	let productMap = $derived.by(() => {
		const map = {};
		inventoryStore.products.forEach(p => { map[p.id] = p; });
		return map;
	});

	function formatDate(dateStr) {
		if (!dateStr) return '';
		let d;
		if (dateStr.includes('-')) {
			d = new Date(dateStr + 'T00:00:00');
		} else {
			const parts = dateStr.split('/');
			if (parts.length === 3) d = new Date(parts[2], parts[1] - 1, parts[0]);
			else return dateStr;
		}
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}

	// Money metrics
	let money = $derived.by(() => {
		let clearedRevenue = 0;
		let pendingRevenue = 0;
		let stockCosts = 0;

		dateFilteredOrders.forEach(order => {
			const total = ordersStore.calculateOrderTotal(order);

			if (order.status === 'completed') {
				clearedRevenue += total;
			} else if (order.status === 'processing' || order.status === 'customer') {
				pendingRevenue += total;
			}

			if (order.status === 'completed') {
				order.items.forEach(item => {
					const product = productMap[item.productId];
					if (product) {
						stockCosts += product.wholesaleCost * item.qty;
					}
				});
			}
		});

		const totalRevenue = clearedRevenue + pendingRevenue;
		const trackerStockCosts = dateFilteredCosts.filter(c => c.costType === 'stock').reduce((sum, c) => sum + c.amount, 0);
		const otherCosts = dateFilteredCosts.filter(c => c.costType !== 'stock').reduce((sum, c) => sum + c.amount, 0);
		stockCosts += trackerStockCosts;
		const workingProfit = clearedRevenue - stockCosts - otherCosts;

		return { clearedRevenue, pendingRevenue, totalRevenue, stockCosts, otherCosts, workingProfit };
	});

	// Activity metrics
	let activity = $derived.by(() => {
		const completed = dateFilteredOrders.filter(o => o.status === 'completed');
		const ordersCompleted = completed.length;

		let itemsSold = 0;
		let totalSaleValue = 0;
		let totalCost = 0;

		completed.forEach(order => {
			order.items.forEach(item => {
				itemsSold += item.qty;
				const product = productMap[item.productId];
				if (product) {
					totalCost += product.wholesaleCost * item.qty;
				}
			});
			totalSaleValue += ordersStore.calculateOrderTotal(order);
		});

		const avgOrderValue = ordersCompleted > 0 ? Math.round(totalSaleValue / ordersCompleted) : 0;
		const profitMargin = totalSaleValue > 0 ? Math.round(((totalSaleValue - totalCost) / totalSaleValue) * 100) : 0;

		return { ordersCompleted, itemsSold, avgOrderValue, profitMargin };
	});

	function selectRange(range) {
		dateRange = range;
		showDatePicker = false;
	}

	function applyCustomRange() {
		if (customFrom && customTo) {
			dateRange = 'custom';
			showDatePicker = false;
		}
	}

	function handleAddCost(entries) {
		entries.forEach(c => costsStore.addCost(c));
		costsStore.sync();
		showCostForm = false;
		showToast('Cost saved');
	}

	function handleUpdateCost(entries) {
		if (entries.length > 0) {
			costsStore.updateCost(editingCost.id, entries[0]);
			costsStore.sync();
		}
		showCostForm = false;
		editingCost = null;
		showToast('Cost saved');
	}

	function openEditCost(cost) {
		editingCost = { ...cost };
		showCostForm = true;
	}

	function closeCostForm() {
		showCostForm = false;
		editingCost = null;
	}

	function handleAddSupplier(data) {
		suppliersStore.addSupplier(data);
		suppliersStore.sync();
		showSupplierForm = false;
		showToast('Supplier saved');
	}

	function handleUpdateSupplier(data) {
		suppliersStore.updateSupplier(editingSupplier.id, data);
		suppliersStore.sync();
		showSupplierForm = false;
		editingSupplier = null;
		showToast('Supplier saved');
	}

	function openEditSupplier(supplier) {
		editingSupplier = { ...supplier, phones: [...supplier.phones] };
		showSupplierForm = true;
	}

	function closeSupplierForm() {
		showSupplierForm = false;
		editingSupplier = null;
	}

	function confirmDeleteCost(cost) {
		deleteConfirm = { type: 'cost', item: cost };
	}

	function confirmDeleteSupplier(supplier) {
		deleteConfirm = { type: 'supplier', item: supplier };
	}

	function executeDeleteConfirm() {
		if (!deleteConfirm) return;
		if (deleteConfirm.type === 'cost') {
			costsStore.deleteCost(deleteConfirm.item.id);
			costsStore.deleteFromRemote(deleteConfirm.item.id);
		} else {
			suppliersStore.deleteSupplier(deleteConfirm.item.id);
			suppliersStore.deleteFromRemote(deleteConfirm.item.id);
		}
		deleteConfirm = null;
	}

	function cancelDeleteConfirm() {
		deleteConfirm = null;
	}

	function exportToCSV() {
		const timestamp = new Date().toISOString().split('T')[0];
		
		// Helper to convert array to CSV
		function arrayToCSV(data, headers) {
			const rows = [headers.join(',')];
			data.forEach(item => {
				const values = headers.map(h => {
					const val = item[h];
					if (val === null || val === undefined) return '';
					const str = String(val).replace(/"/g, '""');
					return /[,"\n]/.test(str) ? `"${str}"` : str;
				});
				rows.push(values.join(','));
			});
			return rows.join('\n');
		}

		// Export orders
		const orderHeaders = ['id', 'date', 'customerName', 'customerPhone', 'source', 'status', 'paymentMethod', 'notes'];
		const orderData = ordersStore.orders.map(o => ({
			id: o.id,
			date: o.date,
			customerName: o.customerName,
			customerPhone: o.customerPhone,
			source: o.source,
			status: o.status,
			paymentMethod: o.paymentMethod,
			notes: o.notes
		}));
		const ordersCSV = arrayToCSV(orderData, orderHeaders);

		// Export inventory
		const invHeaders = ['id', 'name', 'category', 'supplier', 'wholesaleCost', 'retailPrice', 'stock', 'notes', 'dateEntered'];
		const invData = inventoryStore.products.map(p => ({
			id: p.id,
			name: p.name,
			category: p.category,
			supplier: p.supplier,
			wholesaleCost: p.wholesaleCost,
			retailPrice: p.retailPrice,
			stock: p.stock,
			notes: p.notes,
			dateEntered: p.dateEntered
		}));
		const invCSV = arrayToCSV(invData, invHeaders);

		// Export costs
		const costHeaders = ['id', 'date', 'costType', 'description', 'amount'];
		const costData = costsStore.costs.map(c => ({
			id: c.id,
			date: c.date,
			costType: c.costType,
			description: c.description,
			amount: c.amount
		}));
		const costsCSV = arrayToCSV(costData, costHeaders);

		// Export suppliers
		const suppHeaders = ['id', 'name', 'phones', 'email'];
		const suppData = suppliersStore.suppliers.map(s => ({
			id: s.id,
			name: s.name,
			phones: s.phones?.join('; ') || '',
			email: s.email || ''
		}));
		const suppCSV = arrayToCSV(suppData, suppHeaders);

		// Create combined text file with all exports
		const allData = `=== DAZZLE BACKUP ${timestamp} ===\n\n` +
			`ORDERS\n${ordersCSV}\n\n` +
			`INVENTORY\n${invCSV}\n\n` +
			`COSTS\n${costsCSV}\n\n` +
			`SUPPLIERS\n${suppCSV}`;

		// Trigger download
		const blob = new Blob([allData], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `dazzle-backup-${timestamp}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="dashboard-container">
	<!-- Date filter buttons -->
	<div class="date-filters">
		<button
			class="date-btn"
			class:active={dateRange === '7'}
			onclick={() => selectRange('7')}
		>Last 7 days</button>
		<button
			class="date-btn"
			class:active={dateRange === '30'}
			onclick={() => selectRange('30')}
		>Last 30 days</button>
		<button
			class="date-btn date-btn-icon"
			class:active={dateRange === 'custom'}
			onclick={() => (showDatePicker = !showDatePicker)}
		>
			<img src="/icons/icon-calendar.svg" alt="Custom range" width="20" height="20" />
		</button>
	</div>

	{#if showDatePicker}
		<div class="date-picker-panel">
			<div class="date-picker-row">
				<label class="date-picker-label">
					From
					<input type="date" bind:value={customFrom} class="date-input" />
				</label>
				<label class="date-picker-label">
					To
					<input type="date" bind:value={customTo} class="date-input" />
				</label>
			</div>
			<button class="date-picker-apply" onclick={applyCustomRange} disabled={!customFrom || !customTo}>
				Apply
			</button>
		</div>
	{/if}

	<!-- Money -->
	<div class="dash-card" class:open={openSection === 'money'}>
		<button class="dash-card-header" onclick={() => toggleSection('money')}>
			<span class="dash-card-title">Money</span>
			<img
				src={openSection === 'money' ? '/icons/icon-collapse.svg' : '/icons/icon-expand.svg'}
				alt="" width="18" height="18" class="dash-chevron"
			/>
		</button>
		{#if openSection === 'money'}
			<div class="dash-card-body">
				<div class="metric-row">
					<span class="metric-label">Revenue (cleared)</span>
					<span class="metric-value">₦{money.clearedRevenue.toLocaleString()}</span>
				</div>
				<div class="metric-row">
					<span class="metric-label">Revenue (pending)</span>
					<span class="metric-value">₦{money.pendingRevenue.toLocaleString()}</span>
				</div>
				<div class="metric-row">
					<span class="metric-label">Total revenue</span>
					<span class="metric-value">₦{money.totalRevenue.toLocaleString()}</span>
				</div>
				<div class="metric-row">
					<span class="metric-label">Stock costs</span>
					<span class="metric-value">₦{money.stockCosts.toLocaleString()}</span>
				</div>
				<div class="metric-row">
					<span class="metric-label">Other costs</span>
					<span class="metric-value">₦{money.otherCosts.toLocaleString()}</span>
				</div>
				<div class="metric-row highlight">
					<span class="metric-label">Working profit</span>
					<span class="metric-value">₦{money.workingProfit.toLocaleString()}</span>
				</div>
				<div class="metric-row">
					<span class="metric-label">Profit margin</span>
					<span class="metric-value">{activity.profitMargin}%</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Activity -->
	<div class="dash-card" class:open={openSection === 'activity'}>
		<button class="dash-card-header" onclick={() => toggleSection('activity')}>
			<span class="dash-card-title">Activity</span>
			<img
				src={openSection === 'activity' ? '/icons/icon-collapse.svg' : '/icons/icon-expand.svg'}
				alt="" width="18" height="18" class="dash-chevron"
			/>
		</button>
		{#if openSection === 'activity'}
			<div class="dash-card-body">
				<div class="metric-row">
					<span class="metric-label">Orders completed</span>
					<span class="metric-value">{activity.ordersCompleted}</span>
				</div>
				<div class="metric-row">
					<span class="metric-label">Items sold</span>
					<span class="metric-value">{activity.itemsSold}</span>
				</div>
				<div class="metric-row">
					<span class="metric-label">Average order value</span>
					<span class="metric-value">₦{activity.avgOrderValue.toLocaleString()}</span>
				</div>
				<div class="export-row">
					<button type="button" class="btn-export" onclick={exportToCSV}>Download all data</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Cost tracker -->
	<div class="dash-card" class:open={openSection === 'costs'}>
		<button class="dash-card-header" onclick={() => toggleSection('costs')}>
			<span class="dash-card-title">Cost tracker</span>
			<img
				src={openSection === 'costs' ? '/icons/icon-collapse.svg' : '/icons/icon-expand.svg'}
				alt="" width="18" height="18" class="dash-chevron"
			/>
		</button>
		{#if openSection === 'costs'}
			<div class="dash-card-body">
				<button class="btn-new-cost" onclick={() => { editingCost = null; showCostForm = true; }}>
					+ New cost
				</button>
				{#if costsStore.costs.length === 0}
					<p class="admin-placeholder">No costs recorded</p>
				{:else}
					{#each costsStore.costs as cost (cost.id)}
						<div class="cost-entry">
							<div class="cost-row-top">
								<span class="cost-date">{formatDate(cost.date)}</span>
								<span class="cost-supplier">{cost.supplier}</span>
							</div>
							<div class="cost-row-mid">
								<span class="cost-desc">{cost.description}</span>
								<span class="cost-amount">₦{cost.amount.toLocaleString()}</span>
							</div>
							<div class="cost-row-actions">
								<button class="row-action-btn" onclick={() => openEditCost(cost)}>
									<img src="/icons/icon-edit.svg" alt="Edit" width="20" height="20" />
								</button>
								<button class="row-action-btn" onclick={() => confirmDeleteCost(cost)}>
									<img src="/icons/icon-trash.svg" alt="Delete" width="20" height="20" />
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>

	<!-- Supplier contacts -->
	<div class="dash-card" class:open={openSection === 'suppliers'}>
		<button class="dash-card-header" onclick={() => toggleSection('suppliers')}>
			<span class="dash-card-title">Supplier contacts</span>
			<img
				src={openSection === 'suppliers' ? '/icons/icon-collapse.svg' : '/icons/icon-expand.svg'}
				alt="" width="18" height="18" class="dash-chevron"
			/>
		</button>
		{#if openSection === 'suppliers'}
			<div class="dash-card-body">
				<button class="btn-new-cost" onclick={() => { editingSupplier = null; showSupplierForm = true; }}>
					+ New supplier
				</button>
				{#if suppliersStore.suppliers.length === 0}
					<p class="admin-placeholder">No suppliers added</p>
				{:else}
					{#each suppliersStore.suppliers as supplier (supplier.id)}
						<div class="supplier-row">
							<span class="supplier-name">{supplier.name}</span>
							<button class="row-action-btn" onclick={() => openEditSupplier(supplier)}>
								<img src="/icons/icon-edit.svg" alt="Edit" width="20" height="20" />
							</button>
							<button class="row-action-btn" onclick={() => confirmDeleteSupplier(supplier)}>
								<img src="/icons/icon-trash.svg" alt="Delete" width="20" height="20" />
							</button>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>

	<!-- Watermark logo -->
	<img src="/logos/logo-dazzle-trs.png" alt="" class="dash-watermark" />
</div>

{#if showCostForm}
	<CostForm
		onsubmit={editingCost ? handleUpdateCost : handleAddCost}
		oncancel={closeCostForm}
		editCost={editingCost}
	/>
{/if}

{#if showSupplierForm}
	<SupplierForm
		onsubmit={editingSupplier ? handleUpdateSupplier : handleAddSupplier}
		oncancel={closeSupplierForm}
		editSupplier={editingSupplier}
	/>
{/if}

{#if deleteConfirm}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={cancelDeleteConfirm}>
		<div class="modal-card" onclick={(e) => e.stopPropagation()}>
			<p class="modal-message">Delete {deleteConfirm.type === 'cost' ? 'cost' : 'supplier'}?</p>
			<div class="modal-actions">
				<button class="btn-modal-cancel" onclick={cancelDeleteConfirm}>Cancel</button>
				<button class="btn-modal-delete" onclick={executeDeleteConfirm}>Delete</button>
			</div>
		</div>
	</div>
{/if}

{#if toastMessage}
	<div class="toast">{toastMessage}</div>
{/if}

<style>
	.dashboard-container {
		padding: 16px;
		position: relative;
		min-height: 100%;
	}

	.dash-watermark {
		position: fixed;
		bottom: 20%;
		left: 50%;
		transform: translateX(-50%);
		width: 180px;
		opacity: 0.08;
		pointer-events: none;
		z-index: 0;
	}

	/* Date filter buttons */
	.date-filters {
		display: flex;
		gap: 8px;
		margin-bottom: 16px;
	}

	.date-btn {
		flex: 1;
		padding: 12px 16px;
		border: 2px solid var(--dazzle);
		background: white;
		color: var(--dazzle);
		border-radius: 8px;
		font-weight: 600;
		font-size: var(--font-helper);
		cursor: pointer;
	}

	.date-btn.active {
		background: var(--dazzle);
		color: white;
	}

	.date-btn-icon {
		flex: 0 0 auto;
		padding: 10px 14px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.date-btn-icon img {
		filter: brightness(0) saturate(100%) invert(11%) sepia(73%) saturate(6610%) hue-rotate(322deg) brightness(87%) contrast(107%);
	}

	.date-btn-icon.active img {
		filter: brightness(0) invert(1);
	}

	/* Date picker panel */
	.date-picker-panel {
		background: white;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 16px;
	}

	.date-picker-row {
		display: flex;
		gap: 12px;
		margin-bottom: 12px;
	}

	.date-picker-label {
		flex: 1;
		font-size: var(--font-helper);
		font-weight: 600;
		color: var(--text-helper);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.date-input {
		width: 100%;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: var(--font-body);
		font-family: inherit;
		color: var(--text-body);
	}

	.date-picker-apply {
		width: 100%;
		padding: 10px;
		background: var(--dazzle);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		font-size: var(--font-helper);
		cursor: pointer;
	}

	.date-picker-apply:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Card dropdowns */
	.dash-card {
		background: white;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		margin-bottom: 12px;
		position: relative;
		z-index: 1;
	}

	.dash-card.open {
		border-color: var(--dazzle);
		box-shadow: 0 2px 8px rgba(170, 1, 113, 0.1);
	}

	.dash-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 12px 16px;
		border: none;
		background: none;
		cursor: pointer;
	}

	.dash-card-title {
		font-size: var(--font-body);
		font-weight: 700;
		color: var(--dazzle);
	}

	.dash-chevron {
		opacity: 0.4;
	}

	.dash-card-body {
		padding: 0 16px 12px;
	}

	/* Metric rows */
	.metric-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 0;
		border-bottom: 1px solid #f0f0f0;
		font-size: var(--font-body);
	}

	.metric-row:last-of-type {
		border-bottom: none;
	}

	.metric-label {
		color: var(--text-body);
	}

	.metric-value {
		font-weight: 600;
		color: var(--text-body);
	}

	.metric-row.highlight .metric-label,
	.metric-row.highlight .metric-value {
		font-weight: 700;
		color: var(--dazzle);
	}

	.admin-placeholder {
		margin: 0;
		font-size: var(--font-helper);
		color: var(--text-helper);
	}

	.supplier-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 0;
		font-size: var(--font-body);
		color: var(--text-body);
		border-bottom: 1px solid #f0f0f0;
	}

	.supplier-row:last-child {
		border-bottom: none;
	}

	.supplier-name {
		flex: 1;
	}

	/* Costs */
	.btn-new-cost {
		width: 100%;
		background: var(--dazzle);
		color: white;
		border: none;
		padding: 12px 16px;
		border-radius: 8px;
		font-weight: 600;
		font-size: var(--font-body);
		cursor: pointer;
		margin-bottom: 8px;
	}

	.btn-new-cost:active {
		background: #7a0054;
	}

	.cost-entry {
		padding: 10px 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.cost-entry:last-child {
		border-bottom: none;
	}

	.cost-row-top {
		display: flex;
		justify-content: space-between;
		margin-bottom: 2px;
	}

	.cost-date {
		font-size: var(--font-helper);
		color: var(--text-helper);
	}

	.cost-supplier {
		font-size: var(--font-helper);
		color: var(--text-helper);
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 50%;
	}

	.cost-row-mid {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}

	.cost-desc {
		flex: 1;
		font-size: var(--font-body);
		color: var(--text-body);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-right: 12px;
	}

	.cost-amount {
		font-size: var(--font-body);
		font-weight: 600;
		color: var(--text-body);
		white-space: nowrap;
	}

	.cost-row-actions {
		display: flex;
		justify-content: flex-end;
		gap: 4px;
	}

	.row-action-btn {
		border: none;
		background: none;
		padding: 4px;
		cursor: pointer;
	}

	.row-action-btn img {
		opacity: 0.45;
	}

	/* Delete confirmation modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 300;
		padding: 16px;
	}

	.modal-card {
		background: white;
		border-radius: 12px;
		padding: 24px;
		max-width: 300px;
		width: 100%;
		text-align: center;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.modal-message {
		margin: 0 0 20px 0;
		font-size: var(--font-body);
		font-weight: 500;
		color: var(--text-body);
	}

	.modal-actions {
		display: flex;
		gap: 10px;
	}

	.btn-modal-cancel,
	.btn-modal-delete {
		flex: 1;
		padding: 10px;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		font-size: var(--font-helper);
	}

	.btn-modal-cancel {
		background: #f0f0f0;
		color: var(--text-body);
	}

	.btn-modal-delete {
		background: #d32f2f;
		color: white;
	}

	.export-row {
		display: flex;
		justify-content: center;
		padding: 12px 0 0 0;
		margin-top: 12px;
	}

	.btn-export {
		background: none;
		border: none;
		color: var(--dazzle);
		font-size: var(--font-body);
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		text-decoration: none;
	}

	.btn-export:active {
		opacity: 0.8;
	}

	.toast {
		position: fixed;
		bottom: 72px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--dazzle);
		color: white;
		padding: 10px 24px;
		border-radius: 8px;
		font-size: var(--font-helper);
		font-weight: 500;
		z-index: 400;
		animation: fadeInOut 2.5s ease;
	}

	@keyframes fadeInOut {
		0% {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
		10% {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
		90% {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
	}
</style>
