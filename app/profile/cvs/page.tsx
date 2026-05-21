"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getSavedCVs, deleteCV, saveCV, type SavedCV } from "@/lib/user-data-service"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, FileText, Pencil, Copy, Trash2, Plus } from "lucide-react"
import Link from "next/link"

interface LocalSavedCV {
  id: string
  name: string
  cvData: any
  createdAt?: string
  updatedAt?: string
}

interface CVListItem {
  cv: SavedCV
  source: "cloud" | "local"
}

export default function MyCVsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [items, setItems] = useState<CVListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  useEffect(() => {
    const loadCVs = async () => {
      setLoading(true)
      setError(null)

      const localRaw = JSON.parse(localStorage.getItem("saved_cvs") || "[]") as LocalSavedCV[]
      const localItems: CVListItem[] = localRaw
        .filter((entry) => entry?.id)
        .map((entry) => ({
          source: "local",
          cv: {
            id: entry.id,
            name: entry.name || "Saved CV",
            template_type: "local",
            template_name: "Local Saved CV",
            cv_data: (entry.cvData || {}) as any,
            created_at: entry.createdAt,
            updated_at: entry.updatedAt,
          },
        }))

      if (!user?.id) {
        setItems(localItems)
        setLoading(false)
        return
      }

      const { data, error } = await getSavedCVs(user.id)
      if (error) {
        setError(error.message)
        setItems(localItems)
        setLoading(false)
        return
      }

      const cloudItems: CVListItem[] = (data || []).map((cv) => ({ source: "cloud", cv }))
      setItems([...cloudItems, ...localItems])
      setLoading(false)
    }

    loadCVs()
  }, [user?.id])

  const handleDelete = async (item: CVListItem) => {
    if (!confirm("Delete this CV? This cannot be undone.")) return

    const deleteKey = `${item.source}:${item.cv.id}`
    setDeletingId(deleteKey)

    if (item.source === "cloud") {
      const { error } = await deleteCV(item.cv.id!)
      if (error) setError(error.message)
      else setItems((prev) => prev.filter((entry) => !(entry.source === "cloud" && entry.cv.id === item.cv.id)))
      setDeletingId(null)
      return
    }

    const localRaw = JSON.parse(localStorage.getItem("saved_cvs") || "[]") as LocalSavedCV[]
    const updatedLocal = localRaw.filter((entry) => entry.id !== item.cv.id)
    localStorage.setItem("saved_cvs", JSON.stringify(updatedLocal))
    setItems((prev) => prev.filter((entry) => !(entry.source === "local" && entry.cv.id === item.cv.id)))
    setDeletingId(null)
  }

  const handleDuplicate = async (item: CVListItem) => {
    if (item.source !== "cloud") return

    setDuplicatingId(item.cv.id!)
    const { data, error } = await saveCV({
      name: `${item.cv.name} (Copy)`,
      template_type: item.cv.template_type,
      template_name: item.cv.template_name,
      cv_data: item.cv.cv_data,
    })
    if (error) setError(error.message)
    else if (data) setItems((prev) => [{ source: "cloud", cv: data as SavedCV }, ...prev])
    setDuplicatingId(null)
  }

  const handleEdit = (item: CVListItem) => {
    if (item.source === "cloud") {
      router.push(`/create?edit=${item.cv.id}`)
      return
    }

    localStorage.setItem("cv-draft", JSON.stringify(item.cv.cv_data))
    router.push("/create")
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
        ) : items.length === 0 ? (
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
            {items.map((item) => (
              <Card key={`${item.source}:${item.cv.id}`} className="border border-slate-200">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-8 w-8 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{item.cv.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.cv.template_name} · Last updated{" "}
                        {item.cv.updated_at ? new Date(item.cv.updated_at).toLocaleDateString() : "—"}
                        {item.source === "local" ? " · Stored on this browser" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicate(item)}
                      disabled={item.source !== "cloud" || duplicatingId === item.cv.id}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {duplicatingId === item.cv.id ? "Copying..." : "Duplicate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === `${item.source}:${item.cv.id}`}
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
