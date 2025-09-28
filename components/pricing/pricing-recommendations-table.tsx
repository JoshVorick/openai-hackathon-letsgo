"use client";

import { AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PricingRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  roomType: string;
  action: string;
  currentRate: number;
  recommendedRate: number;
  increase: number;
  increasePercentage: number;
  reasoning: string;
  projectedRevenue: {
    weekly?: string;
    monthly?: string;
    event?: string;
  };
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  executionPlan: {
    implementation: string;
    duration: string;
    monitoring: string;
  };
  competitorComparison: {
    belowMarket: boolean;
    marketAverage: number;
    positionAfterChange: string;
  };
};

type PricingRecommendationsTableProps = {
  recommendations: PricingRecommendation[];
  onExecuteAction: (recommendation: PricingRecommendation) => Promise<void>;
  loading?: boolean;
};

export function PricingRecommendationsTable({
  recommendations,
  onExecuteAction,
  loading = false,
}: PricingRecommendationsTableProps) {
  const [executingActions, setExecutingActions] = useState<Set<string>>(
    new Set()
  );

  const handleExecuteAction = async (recommendation: PricingRecommendation) => {
    setExecutingActions((prev) => new Set([...prev, recommendation.id]));
    try {
      await onExecuteAction(recommendation);
    } finally {
      setExecutingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recommendation.id);
        return newSet;
      });
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "default";
      case "medium":
        return "secondary";
      case "high":
        return "destructive";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <Card className="w-full max-w-full">
      <CardHeader className="px-3 py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Pricing Opportunities
        </CardTitle>
        <CardDescription className="text-xs">
          Action-ready recommendations based on market analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        {/* Compact Card View - Always shown in chat context */}
        <div className="space-y-2">
          {recommendations.map((rec) => (
            <div key={rec.id} className="rounded border bg-gray-50 p-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm truncate">{rec.roomType}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="h-6 w-12 bg-green-600 p-0 text-xs hover:bg-green-700"
                      disabled={executingActions.has(rec.id) || loading}
                      size="sm"
                    >
                      {executingActions.has(rec.id) ? "..." : "Execute"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-base">Confirm Rate Change</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-2 text-sm">
                          <div><strong>Room:</strong> {rec.roomType}</div>
                          <div><strong>Change:</strong> ${rec.currentRate} → ${rec.recommendedRate}</div>
                          <div><strong>Increase:</strong> +{rec.increasePercentage.toFixed(1)}%</div>
                          <div className="text-blue-700">{rec.reasoning}</div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleExecuteAction(rec)}
                      >
                        Execute
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Current:</span> <span className="font-medium">${rec.currentRate}</span>
                </div>
                <div>
                  <span className="text-gray-600">Target:</span> <span className="font-medium text-green-600">${rec.recommendedRate}</span>
                </div>
                <div>
                  <span className="text-gray-600">Increase:</span> <span className="font-medium text-green-600">+{rec.increasePercentage.toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Confidence:</span> <span className="font-medium">{(rec.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="mt-2 text-xs">
                <span className="text-gray-600">Revenue:</span>
                <span className="ml-1 font-medium text-green-600">
                  {rec.projectedRevenue.weekly?.replace('/week', '/wk') ||
                   rec.projectedRevenue.monthly?.replace('/month', '/mo') ||
                   rec.projectedRevenue.event}
                </span>
              </div>
            </div>
          ))}
        </div>

        {recommendations.length === 0 && !loading && (
          <div className="py-4 text-center text-muted-foreground">
            <TrendingUp className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-xs">No pricing opportunities found.</p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
