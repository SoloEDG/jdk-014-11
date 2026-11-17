import { ref, type Ref } from "vue";
import type { ComicDocument } from "../../../shared/document";
import { importImages } from "../lib/importImages";
import { demoDocument } from "../lib/demo";
export function useLibrary(
  doc: Ref<ComicDocument>,
  onImport: (id: string) => void,
) {
  const busy = ref(false),
    message = ref("");
  // Each import gets its own token. Resetting (or starting another import)
  // invalidates the token so a task that settles later can no longer publish
  // its chapter, notice or busy state into the current session.
  let generation = 0;
  async function importFiles(files: File[]) {
    if (busy.value) return;
    const own = ++generation;
    busy.value = true;
    message.value = "";
    try {
      const chapter = await importImages(files);
      if (own !== generation) return;
      doc.value.chapters.push(chapter);
      onImport(chapter.id);
      message.value = `已导入 ${chapter.pages.length} 页`;
    } catch (error) {
      if (own !== generation) return;
      message.value = error instanceof Error ? error.message : "导入失败";
    } finally {
      if (own === generation) busy.value = false;
    }
  }
  function reset() {
    generation++;
    busy.value = false;
    doc.value = demoDocument();
    onImport(doc.value.chapters[0]!.id);
    message.value = "已打开内置漫画";
  }
  return { busy, message, importFiles, reset };
}
