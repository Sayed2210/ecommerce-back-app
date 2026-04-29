# Admin Pages Component Refactoring Plan

## Problem

Vue template files exceed 80 lines and have nested depth > 5, which violates lint rules.

## Solution

Extract page logic into reusable admin components following the existing pattern in `app/components/admin/`.

---

## Phase 1: Reusable Admin Components

Create shared components in `app/components/admin/shared/`:

| Component | Purpose |
|-----------|---------|
| `AdminPageHeader.vue` | Title, description, action button |
| `AdminDataTable.vue` | Table wrapper with skeleton/empty states |
| `AdminFormPanel.vue` | Collapsible form container |
| `AdminTableActions.vue` | Edit/Delete buttons with loading state |

---

## Phase 2: Page Refactoring

Extract each admin page into a dedicated component.

### 2.1 Brands

| Original | New Component |
|----------|---------------|
| `pages/admin/brands/index.vue` | `components/admin/brands/BrandsList.vue` |

**Sub-components to create:**
- `BrandsTableRow.vue` — single row with logo display

---

### 2.2 Categories

| Original | New Component |
|----------|---------------|
| `pages/admin/categories/index.vue` | `components/admin/categories/CategoriesList.vue` |

**Sub-components:**
- `CategoriesTableRow.vue` — row with inline edit support
- `CategoryParentSelect.vue` — parent category dropdown

---

### 2.3 Tags

| Original | New Component |
|----------|---------------|
| `pages/admin/tags/index.vue` | `components/admin/tags/TagsList.vue` |

---

### 2.4 Newsletter

| Original | New Component |
|----------|---------------|
| `pages/admin/newsletter/index.vue` | `components/admin/newsletter/NewsletterList.vue` |

---

### 2.5 Search

| Original | New Component |
|----------|---------------|
| `pages/admin/search/index.vue` | `components/admin/search/SearchList.vue` |

---

### 2.6 Staff

| Original | New Component |
|----------|---------------|
| `pages/admin/staff/index.vue` | `components/admin/staff/StaffList.vue` |

---

### 2.7 Products - Create

| Original | New Component |
|----------|---------------|
| `pages/admin/products/create.vue` | `components/admin/products/ProductCreateForm.vue` |

**Sub-components:**
- `ProductBasicInfo.vue` — name, slug, description
- `ProductPricing.vue` — price, sale price, SKU
- `ProductInventory.vue` — stock, track inventory
- `ProductImages.vue` — image upload/URL
- `ProductCategorySelect.vue` — category/tag selection

---

### 2.8 Products - Edit

| Original | New Component |
|----------|---------------|
| `pages/admin/products/[id]/edit.vue` | `components/admin/products/ProductEditForm.vue` |

Reuse sub-components from Create form.

---

### 2.9 Returns

| Original | New Component |
|----------|---------------|
| `pages/admin/returns/index.vue` | `components/admin/returns/ReturnsList.vue` |

---

### 2.10 Orders

Already extracted: `components/admin/orders/OrdersList.vue`

---

## Implementation Strategy

1. **Create reusable shared components first** — reduces duplication across all feature components
2. **Extract each page** — move script logic to component, keep page as thin wrapper
3. **Extract row components** — for tables with many columns, extract individual row component
4. **Extract form sections** — for complex forms, split into logical sections
5. **Run lint** — verify template depth and line count after each refactor

## Example Pattern

**Before** (`pages/admin/brands/index.vue`):
```vue
<template>
  <section>
    <div>...header...</div>
    <form>...create form...</form>
    <table>...list...</table>
  </section>
</template>
```

**After** (`components/admin/brands/BrandsList.vue`):
```vue
<script setup>
const { brands, createBrand, deleteBrand } = useBrands()
// ... handlers
</script>

<template>
  <AdminPageHeader title="Brands">
    <button @click="showCreate = !showCreate">
      {{ showCreate ? 'Cancel' : 'New Brand' }}
    </button>
  </AdminPageHeader>

  <AdminFormPanel v-if="showCreate">
    <form @submit.prevent="handleCreate">...</form>
  </AdminFormPanel>

  <AdminDataTable :pending="pending" :empty="!brands.length">
    <table>...</table>
  </AdminDataTable>
</template>
```

**Page wrapper** (`pages/admin/brands/index.vue`):
```vue
<script setup>
definePageMeta({ layout: 'admin', middleware: 'admin' })
</script>

<template>
  <BrandsList />
</template>
```