"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ConfirmDeploymentButton({
  opportunityId,
  disabled,
}: {
  opportunityId: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        toast.success("Deployment pipeline kicked off", {
          description: `Working on opportunity ${opportunityId}. I'll open the PR, run checks, and update the status once complete.`,
        });
      } catch (error) {
        console.error("Failed to trigger deployment", error);
        toast.error("Something went wrong", {
          description: "Check the console for details and try again.",
        });
      }
    });
  };

  return (
    <Button
      className="bg-neutral-900 text-white hover:bg-neutral-800"
      disabled={disabled || isPending}
      onClick={handleConfirm}
    >
      {isPending ? (
        <>
          <Loader2 className="animate-spin" />
          <span>Deploying…</span>
        </>
      ) : (
        <>
          <CheckCircle2 />
          <span>Approve & deploy</span>
        </>
      )}
    </Button>
  );
}
