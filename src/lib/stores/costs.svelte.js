import { untrack } from 'svelte';
import { supabase } from '$lib/utils/supabase.js';

/**
 * @typedef {Object} Cost
 * @property {string} id - C-00001 format
 * @property {string} date - YYYY-MM-DD format
 * @property {string} description - Expense description
 * @property {string} supplier - Supplier name
 * @property {number} amount - Cost amount in Naira
 */

let nextCostNum = 1;

export function createCostsStore() {
	const costs = $state([]);

	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('dazzle_costs');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				costs.push(...parsed);
				if (parsed.length > 0) {
					nextCostNum = Math.max(...parsed.map(c => parseInt(c.id.split('-')[1]))) + 1;
				}
			} catch (e) {
				console.error('Failed to load costs:', e);
			}
		}
	}

	return {
		get costs() {
			return costs;
		},

		addCost(data) {
			const id = `C-${String(nextCostNum).padStart(5, '0')}`;
			nextCostNum++;

			const cost = {
				id,
				date: data.date || new Date().toISOString().split('T')[0],
				description: data.description,
				supplier: data.supplier || '',
				amount: parseFloat(data.amount),
				costType: data.costType || 'other'
			};

			costs.push(cost);
			this.save();
			return cost;
		},

		updateCost(id, updates) {
			const idx = costs.findIndex(c => c.id === id);
			if (idx === -1) return;
			Object.assign(costs[idx], updates);
			this.save();
		},

		deleteCost(id) {
			const idx = costs.findIndex(c => c.id === id);
			if (idx !== -1) {
				costs.splice(idx, 1);
				this.save();
			}
		},

		save() {
			if (typeof window !== 'undefined') {
				localStorage.setItem('dazzle_costs', JSON.stringify(untrack(() => costs)));
			}
		},

		async sync() {
			if (typeof window === 'undefined') return;
			const data = untrack(() => [...costs]);

			const rows = data.map(c => ({
				id: c.id,
				date: c.date,
				description: c.description,
				supplier: c.supplier,
				amount: c.amount,
				cost_type: c.costType || 'other'
			}));

			const { error } = await supabase
				.from('costs')
				.upsert(rows, { onConflict: 'id' });

			if (error) {
				console.error('Costs sync failed:', error.message);
			} else {
				console.log('Costs synced:', rows.length, 'costs');
			}
		},

		async deleteFromRemote(id) {
			const { error } = await supabase.from('costs').delete().eq('id', id);
			if (error) console.error('Remote delete failed:', error.message);
		}
	};
}

export const costsStore = createCostsStore();
