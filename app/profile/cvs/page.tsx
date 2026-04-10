"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSavedCVs, deleteCV, saveCV, type SavedCV } from "@/lib/user-data-service"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, FileText, Pencil, Copy, Trash2, Plus } from "lucide-react"
import Link from "next/link"

export default function MyCVsPage() {
  const router = useRouter()
  const [cvs, setCvs] = useState<SavedCV[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  useEffect(() => {
    getSavedCVs().then(({ data, error }) => {
      if (error) setError(error.message)
      else setCvs(data || [])
      setLoading(false)
    })
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this CV? This cannot be undone.")) return
    setDeletingId(id)
    const { error } = await deleteCV(id)
    if (error) setError(error.message)
    else setCvs((prev) => prev.filter((cv) => cv.id !== id))
    setDeletingId(null)
  }

  const handleDuplicate = async (cv: SavedCV) => {
    setDuplicatingId(cv.id!)
    const { data, error } = await saveCV({
      name: `${cv.name} (Copy)`,
      template_type: cv.template_type,
      template_name: cv.template_name,
      cv_data: cv.cv_data,
    })
    if (error) setError(error.message)
    else if (data) setCvs((prev) => [data as SavedCV, ...prev])
    setDuplicatingId(null)
  }

  const handleEdit = (cv: SavedCV) => {
    localStorage.setItem("editCV", JSON.stringify(cv))
    router.push(`/create?edit=${cv.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="My CVs" description="View, edit or reuse your saved CVs" />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : cvs.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <FileText className="h-12 w-12 text-slate-300 mx-auto" />
            <p className="text-slate-500">You haven't saved any CVs yet.</p>
            <Link href="/templates">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Create your first CV
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Link href="/templates">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" /> New CV
                </Button>
              </Link>
            </div>
            {cvs.map((cv) => (
              <Card key={cv.id} className="border border-slate-200">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-8 w-8 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{cv.name}</p>
                      <p className="text-xs text-slate-500">
                        {cv.template_name} · Last updated{" "}
                        {cv.updated_at ? new Date(cv.updated_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(cv)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicate(cv)}
                      disabled={duplicatingId === cv.id}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {duplicatingId === cv.id ? "Copying..." : "Duplicate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                      onClick={() => handleDelete(cv.id!)}
                      disabled={deletingId === cv.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
