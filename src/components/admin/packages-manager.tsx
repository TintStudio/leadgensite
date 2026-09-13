"use client";

import { useState } from "react";
import {
  Check,
  Edit2,
  X,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { PackagePlan } from "@/lib/config/packages";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PackagesManagerProps {
  initialPackages: PackagePlan[];
}

export function PackagesManager({ initialPackages }: PackagesManagerProps) {
  const [packages, setPackages] = useState<PackagePlan[]>(initialPackages);
  const [editingPkg, setEditingPkg] = useState<PackagePlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenEdit = (pkg: PackagePlan) => {
    // Deep clone to allow safe editing
    setEditingPkg(JSON.parse(JSON.stringify(pkg)));
  };

  const handleSavePackage = async () => {
    if (!editingPkg) return;

    try {
      setIsSaving(true);
      const res = await fetch("/api/admin/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: editingPkg.id,
          updates: editingPkg,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save package");
      }

      setPackages((prev) =>
        prev.map((p) => (p.id === editingPkg.id ? editingPkg : p))
      );

      setToastMessage("Package updated successfully!");
      setEditingPkg(null);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update package";
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeatureChange = (index: number, val: string) => {
    if (!editingPkg) return;
    const updatedFeatures = [...editingPkg.features];
    updatedFeatures[index] = val;
    setEditingPkg({ ...editingPkg, features: updatedFeatures });
  };

  const addFeature = () => {
    if (!editingPkg) return;
    setEditingPkg({
      ...editingPkg,
      features: [...editingPkg.features, "New feature perk"],
    });
  };

  const removeFeature = (index: number) => {
    if (!editingPkg) return;
    setEditingPkg({
      ...editingPkg,
      features: editingPkg.features.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-md font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`border flex flex-col justify-between relative transition-all ${
              pkg.isPopular
                ? "border-primary ring-2 ring-primary/20 shadow-md"
                : "border-border"
            }`}
          >
            {pkg.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="default" className="text-[10px] font-bold px-2 py-0.5 shadow-xs">
                  Most Popular
                </Badge>
              </div>
            )}

            <div>
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-foreground">
                    {pkg.name}
                  </CardTitle>
                  <Badge
                    variant={pkg.isActive ? "secondary" : "outline"}
                    className="text-[10px] uppercase font-mono"
                  >
                    {pkg.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  {pkg.description}
                </CardDescription>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    ${pkg.price}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {pkg.billingInterval}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Usage Limits */}
                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Website Limit:</span>
                    <span className="font-semibold text-foreground">{pkg.websiteLimit} sites</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pages Per Site:</span>
                    <span className="font-semibold text-foreground">{pkg.pagesPerSiteLimit} pages</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI Generations:</span>
                    <span className="font-semibold text-foreground">{pkg.aiGenerationsLimit} runs</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground block">
                    Included Features:
                  </span>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </div>

            <div className="p-4 border-t border-border bg-muted/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEdit(pkg)}
                className="w-full text-xs font-semibold gap-1.5 border-border"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit Plan & Limits
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-lg border border-border bg-background shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Edit Package: {editingPkg.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Update package pricing, website quotas, and features list.
                </p>
              </div>
              <button
                onClick={() => setEditingPkg(null)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Plan Name</Label>
                  <Input
                    value={editingPkg.name}
                    onChange={(e) => setEditingPkg({ ...editingPkg, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Price ($ USD)</Label>
                  <Input
                    type="number"
                    value={editingPkg.price}
                    onChange={(e) =>
                      setEditingPkg({ ...editingPkg, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description</Label>
                <Input
                  value={editingPkg.description}
                  onChange={(e) => setEditingPkg({ ...editingPkg, description: e.target.value })}
                />
              </div>

              {/* Quotas */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-md border border-border">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Websites Limit</Label>
                  <Input
                    type="number"
                    value={editingPkg.websiteLimit}
                    onChange={(e) =>
                      setEditingPkg({ ...editingPkg, websiteLimit: parseInt(e.target.value) || 1 })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Pages / Site</Label>
                  <Input
                    type="number"
                    value={editingPkg.pagesPerSiteLimit}
                    onChange={(e) =>
                      setEditingPkg({ ...editingPkg, pagesPerSiteLimit: parseInt(e.target.value) || 1 })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">AI Runs Limit</Label>
                  <Input
                    type="number"
                    value={editingPkg.aiGenerationsLimit}
                    onChange={(e) =>
                      setEditingPkg({
                        ...editingPkg,
                        aiGenerationsLimit: parseInt(e.target.value) || 1,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Feature Bullets</Label>
                  <Button
                    onClick={addFeature}
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] px-2 gap-1 border-border"
                  >
                    <Plus className="h-3 w-3" /> Add Feature
                  </Button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {editingPkg.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Input
                        value={feat}
                        onChange={(e) => handleFeatureChange(i, e.target.value)}
                        className="h-7 text-xs"
                      />
                      <button
                        onClick={() => removeFeature(i)}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active / Popular Toggles */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPkg.isActive}
                    onChange={(e) => setEditingPkg({ ...editingPkg, isActive: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="font-semibold text-xs text-foreground">Active for Users</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingPkg.isPopular}
                    onChange={(e) => setEditingPkg({ ...editingPkg, isPopular: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="font-semibold text-xs text-foreground">Mark as Most Popular</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-6 py-3 bg-muted/30 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingPkg(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSavePackage}
                disabled={isSaving}
                className="text-xs font-semibold"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
