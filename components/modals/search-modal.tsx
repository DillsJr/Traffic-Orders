import { KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { useModalStore } from "stores/modal-store"
import { Input } from "components/ui/input"
import { Button } from "components/ui/button-old"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "components/ui/dialog"

export function SearchModal() {
  const router = useRouter()
  const { modals } = useModalStore((s) => s)
  const closeModal = useModalStore((s) => s.closeModal)

  function handleSearch(query: string) {
    if (!query) return
    router.push(`/search?q=${query}`)
    closeModal("search")
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, query: string) {
    if (e.key === "Enter") {
      handleSearch(query)
    }
  }

  return (
    <Dialog open={!!modals["search"]} onOpenChange={() => closeModal("search")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Input
              placeholder="Search"
              type="search"
              autoFocus
              onKeyDown={(e) => onKeyDown(e, e.currentTarget.value)}
            />
          </DialogTitle>
          <DialogClose>Close</DialogClose>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}