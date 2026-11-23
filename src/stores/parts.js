import { defineStore } from 'pinia'
import { fetchParts, getBrands } from '@/data/parts'

// 配件库状态：分类、筛选条件、排序，以及派生出的列表结果
export const usePartsStore = defineStore('parts', {
  state: () => ({
    category: 'all',
    brands: [],
    priceRange: null,
    sort: 'newest',
  }),
  getters: {
    list: (state) =>
      fetchParts({
        category: state.category,
        brands: state.brands,
        priceRange: state.priceRange,
        sort: state.sort,
      }),
    availableBrands: (state) => getBrands(state.category),
    totalPrice: (state) => {
      const list = fetchParts({
        category: state.category,
        brands: state.brands,
        priceRange: state.priceRange,
        sort: state.sort,
      })
      return list.reduce((sum, p) => sum + p.price, 0)
    },
  },
  actions: {
    setCategory(category) {
      this.category = category
      this.brands = []
      this.priceRange = null
    },
    toggleBrand(brand) {
      const idx = this.brands.indexOf(brand)
      if (idx >= 0) this.brands.splice(idx, 1)
      else this.brands.push(brand)
    },
    clearFilters() {
      this.brands = []
      this.priceRange = null
      this.sort = 'newest'
    },
  },
})