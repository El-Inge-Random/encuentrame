import { getOwnerBusiness, getCategories, createBusiness, updateBusiness } from '@/app/actions/business'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Category } from '@/types'

export const dynamic = 'force-dynamic'

export default async function NegocioPage() {
  const [business, categories] = await Promise.all([
    getOwnerBusiness(),
    getCategories(),
  ])

  async function action(formData: FormData) {
    'use server'
    if (business) {
      await updateBusiness(business.id, formData)
    } else {
      await createBusiness(formData)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {business ? 'Editar negocio' : 'Registrar negocio'}
      </h1>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <form action={action} className="space-y-5">
          <div>
            <Label htmlFor="name">Nombre del negocio *</Label>
            <Input id="name" name="name" required className="mt-1" defaultValue={business?.name} />
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={business?.description || ''}
              placeholder="Describe tu negocio..."
            />
          </div>
          <div>
            <Label htmlFor="category_id">Categoría</Label>
            <select
              id="category_id"
              name="category_id"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={business?.category_id?.toString() || ''}
            >
              <option value="">Seleccionar categoría</option>
              {(categories as Category[]).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" name="address" className="mt-1" defaultValue={business?.address || ''} placeholder="Calle, colonia..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" className="mt-1" defaultValue={business?.phone || ''} placeholder="2727..." />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp (con código país)</Label>
              <Input id="whatsapp" name="whatsapp" className="mt-1" defaultValue={business?.whatsapp || ''} placeholder="527227..." />
            </div>
          </div>
          <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800">
            {business ? 'Guardar cambios' : 'Registrar negocio'}
          </Button>
        </form>
      </div>
    </div>
  )
}
