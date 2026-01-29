import { notFound } from "next/navigation";
import { getPublicResume } from "@/lib/resumes/actions";
import { PublicResumeViewer } from "./PublicResumeViewer";

type PageProps = {
  params: Promise<{ shareSlug: string }>;
};

export default async function PublicResumePage({ params }: PageProps) {
  const { shareSlug } = await params;
  
  const resume = await getPublicResume(shareSlug);

  if (!resume) {
    notFound();
  }

  return <PublicResumeViewer resume={resume} />;
}
