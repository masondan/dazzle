import { untrack } from 'svelte';
import { supabase } from '$lib/utils/supabase.js';

/**
 * @typedef {Object} Supplier
 * @property {string} id - S-00001 format
 * @property {string} name - Supplier name
 * @property {string} address - Supplier address
 * @property {string[]} phones - Phone numbers
 * @property {string} notes - Notes
 */

let nextSupplierNum = 1;

export function createSuppliersStore() {
	const suppliers = $state([]);

	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('dazzle_suppliers');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				// Migrate plain strings to objects
				const migrated = parsed.map((s, i) => {
					if (typeof s === 'string') {
						return { id: `S-${String(i + 1).padStart(5, '0')}`, name: s, address: '', phones: [''], notes: '' };
					}
					return s;
				});
				suppliers.push(...migrated);
				if (migrated.length > 0) {
					nextSupplierNum = Math.max(...migrated.map(s => parseInt(s.id.split('-')[1]))) + 1;
				}
				// Re-save if migrated
				if (parsed.some(s => typeof s === 'string')) {
					localStorage.setItem('dazzle_suppliers', JSON.stringify(migrated));
				}
			} catch (e) {
				console.error('Failed to load suppliers:', e);
			}
		}
	}

	return {
		get suppliers() {
			return suppliers;
		},

		/** @returns {string[]} Supplier names for dropdowns */
		get supplierNames() {
			return suppliers.map(s => s.name);
		},

		addSupplier(data) {
			const id = `S-${String(nextSupplierNum).padStart(5, '0')}`;
			nextSupplierNum++;

			const supplier = {
				id,
				name: typeof data === 'string' ? data : data.name,
				address: (typeof data === 'string' ? '' : data.address) || '',
				phones: (typeof data === 'string' ? [''] : data.phones) || [''],
				notes: (typeof data === 'string' ? '' : data.notes) || ''
			};

			suppliers.push(supplier);
			this.save();
			return supplier;
		},

		updateSupplier(id, updates) {
			const idx = suppliers.findIndex(s => s.id === id);
			if (idx === -1) return;
			Object.assign(suppliers[idx], updates);
			this.save();
		},

		deleteSupplier(id) {
			const idx = suppliers.findIndex(s => s.id === id);
			if (idx !== -1) {
				suppliers.splice(idx, 1);
				this.save();
			}
		},

		save() {
			if (typeof window !== 'undefined') {
				localStorage.setItem('dazzle_suppliers', JSON.stringify(untrack(() => suppliers)));
			}
		},

		async sync() {
			if (typeof window === 'undefined') return;
			const data = untrack(() => [...suppliers]);

			const rows = data.map(s => ({
				id: s.id,
				name: s.name,
				address: s.address || '',
				phones: s.phones || [],
				notes: s.notes || ''
			}));

			const { error } = await supabase
				.from('suppliers')
				.upsert(rows, { onConflict: 'id' });

			if (error) {
				console.error('Suppliers sync failed:', error.message);
			} else {
				console.log('Suppliers synced:', rows.length, 'suppliers');
			}
		},

		async deleteFromRemote(id) {
			const { error } = await supabase.from('suppliers').delete().eq('id', id);
			if (error) console.error('Remote delete failed:', error.message);
		}
	};
}

export const suppliersStore = createSuppliersStore();
