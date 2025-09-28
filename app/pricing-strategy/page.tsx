"use client";

import { ArrowLeft, Edit2, MapPin, MessageCircle, Play, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BellhopMark } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Competitor = {
  id: number;
  name: string;
  address: string;
  distance: string;
};

export default function PricingStrategyPage() {
  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>([
    {
      id: 1,
      name: "Marriott Downtown",
      address: "123 Main St",
      distance: "0.2 mi",
    },
    {
      id: 2,
      name: "Hilton City Center",
      address: "456 Oak Ave",
      distance: "0.3 mi",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [baseRate, setBaseRate] = useState(180);
  const [markupRates, setMarkupRates] = useState({
    standard: 0,
    deluxe: 10,
    king: 15,
    suite: 25,
    penthouse: 40,
  });
  const [editingMarkup, setEditingMarkup] = useState<string | null>(null);
  const [competitorStrategy, setCompetitorStrategy] = useState(
    "Always $15 below lowest competitor"
  );

  const allCompetitors: Competitor[] = [
    {
      id: 1,
      name: "Marriott Downtown",
      address: "123 Main St",
      distance: "0.2 mi",
    },
    {
      id: 2,
      name: "Hilton City Center",
      address: "456 Oak Ave",
      distance: "0.3 mi",
    },
    {
      id: 3,
      name: "Hyatt Regency",
      address: "789 Pine St",
      distance: "0.4 mi",
    },
    {
      id: 4,
      name: "Sheraton Grand",
      address: "321 Elm St",
      distance: "0.5 mi",
    },
    {
      id: 5,
      name: "Four Seasons",
      address: "654 Cedar Ave",
      distance: "0.6 mi",
    },
    { id: 6, name: "W Hotel", address: "987 Maple Dr", distance: "0.7 mi" },
  ];

  const availableCompetitors = allCompetitors.filter(
    (comp) =>
      !selectedCompetitors.find((selected) => selected.id === comp.id) &&
      comp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addCompetitor = (competitor: Competitor) => {
    setSelectedCompetitors([...selectedCompetitors, competitor]);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const removeCompetitor = (id: number) => {
    setSelectedCompetitors(
      selectedCompetitors.filter((comp) => comp.id !== id)
    );
  };

  const updateMarkupRate = (roomType: string, value: number) => {
    setMarkupRates((prev) => ({ ...prev, [roomType]: value }));
    setEditingMarkup(null);
  };

  const handleBellhopKickoff = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bellhop:kickoff", {
          detail: {
            prompt: `I want to analyze our pricing strategy. We have ${selectedCompetitors.length} competitors selected: ${selectedCompetitors.map((c) => c.name).join(", ")}. Our base rate is $${baseRate} and our competitor strategy is: ${competitorStrategy}. Can you help me optimize our pricing approach?`,
            source: "pricing-strategy-page",
          },
        })
      );
    }
  };

  const handleSamplePricingPrompt = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bellhop:kickoff", {
          detail: {
            prompt:
              "What should my price be for Friday, Oct 3, 2025 6 days out when my occupancy is 60%, Hilton is $120/night and Marriott is $180/night base rate?",
            source: "pricing-strategy-sample",
          },
        })
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#050403] text-[#F4EDE5]">
      <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-3 pt-10 pb-28 sm:px-4">
        {/* Header */}
        <div className="flex items-center justify-between border-[#32271F] border-b pb-6">
          <div className="flex items-center gap-3">
            <Link
              className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-[#1A1410]"
              href="/"
            >
              <ArrowLeft className="h-5 w-5 text-[#8F7F71]" />
            </Link>
            <BellhopMark className="h-9 w-9 text-[#F4EDE5]" />
            <h1 className="font-semibold text-[#F4EDE5] text-xl">
              Pricing Strategy
            </h1>
          </div>
        </div>

        {/* Voiceover Caption */}
        <div className="mt-6 rounded-2xl border border-[#32271F] bg-gradient-to-b from-[#19130E] to-[#0F0C09] p-4 shadow-[0_26px_44px_rgba(0,0,0,0.45)]">
          <p className="text-[#8F7F71] text-sm leading-relaxed">
            Define your hotel pricing logic here. Bellhop turns it into
            automated pricing decisions that execute in real-time.
          </p>
        </div>

        {/* Competitor Selection */}
        <Card className="mt-6 border-[#32271F] bg-gradient-to-b from-[#19130E] to-[#0F0C09] shadow-[0_26px_44px_rgba(0,0,0,0.45)]">
          <CardHeader>
            <CardTitle className="text-[#F4EDE5] text-lg">
              Select Your Competitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Selected Competitors */}
              <div className="space-y-2">
                {selectedCompetitors.map((competitor) => (
                  <div
                    className="flex items-center justify-between rounded-2xl border border-[#2E241C] bg-[#14100C]/90 p-3"
                    key={competitor.id}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-[#8F7F71]" />
                      <div>
                        <div className="font-medium text-[#F4E9DA] text-sm">
                          {competitor.name}
                        </div>
                        <div className="text-[#8F7F71] text-xs">
                          {competitor.address} • {competitor.distance}
                        </div>
                      </div>
                    </div>
                    <Button
                      className="h-8 w-8 p-0 text-[#8F7F71] hover:bg-[#3C2E23] hover:text-[#F4E9DA]"
                      onClick={() => removeCompetitor(competitor.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-[#3A2A20] bg-[#0C0806] p-3 text-[#F4E3CE] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF922C]/40"
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                  placeholder="Search for nearby hotels..."
                  type="text"
                  value={searchQuery}
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && availableCompetitors.length > 0 && (
                  <div className="absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-[#32271F] bg-[#14100C] shadow-[0_26px_44px_rgba(0,0,0,0.45)]">
                    {availableCompetitors.slice(0, 4).map((competitor) => (
                      <button
                        className="w-full border-[#2E241C]/50 border-b p-3 text-left first:rounded-t-2xl last:rounded-b-2xl last:border-b-0 hover:bg-[#1A1410]"
                        key={competitor.id}
                        onClick={() => addCompetitor(competitor)}
                        type="button"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-[#8F7F71]" />
                          <div>
                            <div className="font-medium text-[#F4E9DA] text-sm">
                              {competitor.name}
                            </div>
                            <div className="text-[#8F7F71] text-xs">
                              {competitor.address} • {competitor.distance}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[#8F7F71] text-xs">
                Powered by Google Places API • {selectedCompetitors.length}{" "}
                competitors selected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Base Rate */}
        <Card className="mt-6 border-[#32271F] bg-gradient-to-b from-[#19130E] to-[#0F0C09] shadow-[0_26px_44px_rgba(0,0,0,0.45)]">
          <CardHeader>
            <CardTitle className="text-[#F4EDE5] text-lg">Base Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#8F7F71] text-sm">
                <span>Standard room rate starts at</span>
                <div className="relative">
                  <span className="-translate-y-1/2 absolute top-1/2 left-3 transform font-semibold text-[#F4E9DA] text-lg">
                    $
                  </span>
                  <input
                    className="w-20 rounded-md border border-[#3A2A20] bg-[#0C0806] py-1 pr-3 pl-7 text-center font-semibold text-[#F4E9DA] text-lg focus:outline-none focus:ring-2 focus:ring-[#FF922C]/40"
                    onChange={(e) => setBaseRate(Number(e.target.value))}
                    type="number"
                    value={baseRate}
                  />
                </div>
                <span>per night.</span>
              </div>
              <p className="text-[#8F7F71] text-sm">
                This base rate applies to all room types before markup
                adjustments and occupancy modifications are calculated.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Markup Rates */}
        <Card className="mt-4 border-[#32271F] bg-gradient-to-b from-[#19130E] to-[#0F0C09] shadow-[0_26px_44px_rgba(0,0,0,0.45)]">
          <CardHeader>
            <CardTitle className="text-[#F4EDE5] text-lg">
              Markup Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(markupRates).map(([roomType, rate]) => (
                <div
                  className="flex items-center justify-between border-[#2F241B]/50 border-b py-2 last:border-b-0"
                  key={roomType}
                >
                  <span className="text-[#F4E9DA] text-sm capitalize">
                    {roomType}
                  </span>
                  <div className="flex items-center gap-2">
                    {editingMarkup === roomType ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[#8F7F71] text-sm">+</span>
                        <input
                          autoFocus
                          className="w-12 rounded border border-[#3A2A20] bg-[#0C0806] px-1 py-0.5 text-center text-[#F4E9DA] text-sm focus:outline-none focus:ring-1 focus:ring-[#FF922C]/40"
                          onBlur={() => setEditingMarkup(null)}
                          onChange={(e) =>
                            updateMarkupRate(roomType, Number(e.target.value))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setEditingMarkup(null);
                            }
                          }}
                          type="number"
                          value={rate}
                        />
                        <span className="text-[#8F7F71] text-sm">%</span>
                      </div>
                    ) : (
                      <button
                        className="group flex items-center gap-1 rounded px-2 py-1 hover:bg-[#1A1410]"
                        onClick={() => setEditingMarkup(roomType)}
                        type="button"
                      >
                        <Badge
                          className="bg-[#FF922C] text-[#1D1107] hover:bg-[#FF922C]/90"
                          variant="secondary"
                        >
                          +{rate}%
                        </Badge>
                        <Edit2 className="h-3 w-3 text-[#8F7F71] opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Adjustments */}
        <Card className="mt-4 border-[#32271F] bg-gradient-to-b from-[#19130E] to-[#0F0C09] shadow-[0_26px_44px_rgba(0,0,0,0.45)]">
          <CardHeader>
            <CardTitle className="text-[#F4EDE5] text-lg">
              Occupancy Adjustments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-[#8F7F71] text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#FF922C]" />
                If 6-10 days out and occupancy {"<"} 70% → -$15
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#FF922C]" />
                If occupancy {">"} 90% → +$25
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#FF922C]" />
                Weekend premium: Friday +$9, Saturday +$15
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Competitor Strategy */}
        <Card className="mt-4 border-[#32271F] bg-gradient-to-b from-[#19130E] to-[#0F0C09] shadow-[0_26px_44px_rgba(0,0,0,0.45)]">
          <CardHeader>
            <CardTitle className="text-[#F4EDE5] text-lg">
              Competitor Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <textarea
                className="w-full resize-none rounded-2xl border border-[#3A2A20] bg-[#0C0806] p-3 text-[#F4E3CE] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF922C]/40"
                onChange={(e) => setCompetitorStrategy(e.target.value)}
                placeholder="Describe your pricing strategy relative to competitors...

Examples:
• Always $15 below lowest competitor
• Match median competitor price within $5
• Price 10% above Marriott but never exceed $300
• Stay competitive with Hilton except on weekends
• Undercut all competitors by $20 during low season"
                rows={6}
                value={competitorStrategy}
              />
              <p className="text-[#8F7F71] text-xs">
                Describe how you want to price relative to your selected
                competitors. Be as specific as possible.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTAs */}
        <div className="mt-8 space-y-3 pb-8">
          <Button
            className="w-full bg-[#FF922C] font-semibold text-[#1D1107] shadow-[0_18px_30px_rgba(255,146,44,0.45)] transition hover:scale-[1.02] hover:bg-[#FF922C]/90"
            onClick={handleBellhopKickoff}
            size="lg"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Ask Bellhop to analyze this strategy
          </Button>
          <Button
            className="w-full border-[#8F7F71] bg-transparent text-[#F4E9DA] hover:bg-[#1A1410] hover:text-[#F4E9DA]"
            onClick={handleSamplePricingPrompt}
            size="lg"
            variant="outline"
          >
            <Play className="mr-2 h-4 w-4" />
            Try with sample data
          </Button>
        </div>
      </div>
    </main>
  );
}
