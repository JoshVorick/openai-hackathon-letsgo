"use client";

import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Pricing Optimization Opportunities
        </CardTitle>
        <CardDescription>
          Action-ready pricing recommendations based on market analysis and
          occupancy data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Type</TableHead>
                <TableHead>Current Rate</TableHead>
                <TableHead>Recommended Rate</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Revenue Impact</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map((recommendation) => (
                <TableRow key={recommendation.id}>
                  <TableCell className="font-medium">
                    {recommendation.roomType}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(recommendation.currentRate)}
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(recommendation.recommendedRate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-green-600">
                        +{formatCurrency(recommendation.increase)}(
                        {recommendation.increasePercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {recommendation.projectedRevenue.weekly && (
                        <div className="font-medium text-green-600">
                          {recommendation.projectedRevenue.weekly}/week
                        </div>
                      )}
                      {recommendation.projectedRevenue.monthly && (
                        <div className="text-muted-foreground">
                          {recommendation.projectedRevenue.monthly}/month
                        </div>
                      )}
                      {recommendation.projectedRevenue.event && (
                        <div className="font-medium text-blue-600">
                          {recommendation.projectedRevenue.event} (event)
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress
                        className="h-2 w-16"
                        value={recommendation.confidence * 100}
                      />
                      <span className="text-muted-foreground text-xs">
                        {(recommendation.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getRiskBadgeColor(recommendation.riskLevel)}
                    >
                      {recommendation.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getPriorityBadgeColor(recommendation.priority)}
                    >
                      {recommendation.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          disabled={
                            executingActions.has(recommendation.id) || loading
                          }
                          size="sm"
                        >
                          {executingActions.has(recommendation.id)
                            ? "Executing..."
                            : "Execute Change"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Confirm Rate Change
                          </AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Room Type:</strong>{" "}
                                  {recommendation.roomType}
                                </div>
                                <div>
                                  <strong>Rate Change:</strong>{" "}
                                  {formatCurrency(recommendation.currentRate)} →{" "}
                                  {formatCurrency(
                                    recommendation.recommendedRate
                                  )}
                                </div>
                                <div>
                                  <strong>Increase:</strong> +
                                  {formatCurrency(recommendation.increase)} (
                                  {recommendation.increasePercentage.toFixed(1)}
                                  %)
                                </div>
                                <div>
                                  <strong>Implementation:</strong>{" "}
                                  {recommendation.executionPlan.implementation}
                                </div>
                              </div>

                              <div className="rounded-lg bg-blue-50 p-3">
                                <p className="font-medium text-blue-900">
                                  Reasoning:
                                </p>
                                <p className="text-blue-800 text-sm">
                                  {recommendation.reasoning}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Market Position:</strong>
                                  <p className="text-muted-foreground">
                                    Currently $
                                    {
                                      recommendation.competitorComparison
                                        .marketAverage
                                    }{" "}
                                    market avg
                                  </p>
                                  <p className="text-green-600">
                                    After change:{" "}
                                    {recommendation.competitorComparison.positionAfterChange.replace(
                                      /_/g,
                                      " "
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <strong>Monitoring Plan:</strong>
                                  <p className="text-muted-foreground">
                                    {recommendation.executionPlan.monitoring.replace(
                                      /_/g,
                                      " "
                                    )}
                                  </p>
                                  <p className="text-muted-foreground">
                                    Duration:{" "}
                                    {recommendation.executionPlan.duration.replace(
                                      /_/g,
                                      " "
                                    )}
                                  </p>
                                </div>
                              </div>

                              {recommendation.riskLevel !== "low" && (
                                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                                  <div>
                                    <p className="font-medium text-amber-900">
                                      Risk Assessment:{" "}
                                      {recommendation.riskLevel}
                                    </p>
                                    <p className="text-amber-800 text-sm">
                                      Monitor booking pace closely after
                                      implementation. Rates can be adjusted if
                                      needed.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleExecuteAction(recommendation)}
                          >
                            Execute Rate Change
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {recommendations.length === 0 && !loading && (
          <div className="py-8 text-center text-muted-foreground">
            <TrendingUp className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No pricing opportunities identified at this time.</p>
            <p className="text-sm">
              Check back later or adjust your analysis parameters.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
