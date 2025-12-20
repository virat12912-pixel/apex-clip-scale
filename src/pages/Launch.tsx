import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  Upload, 
  DollarSign, 
  Target, 
  Calendar,
  Info,
  ArrowRight,
  ImagePlus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const categories = [
  "Gaming",
  "Fitness",
  "Tech",
  "Music",
  "Food",
  "Lifestyle",
  "Education",
  "Entertainment",
];

const Launch = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    cpm: "",
    targetViews: "",
    deadline: "",
    guidelines: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Campaign created!",
      description: "Your campaign is now live and visible to clippers.",
    });
    navigate("/dashboard");
  };

  return (
    <AppLayout title="Launch Campaign">
      <div className="max-w-3xl mx-auto">
        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    step >= s
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-full h-1 mx-2 rounded-full transition-colors ${
                      step > s ? "bg-primary" : "bg-secondary"
                    }`}
                    style={{ width: "100px" }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Basic Info</span>
            <span>Budget & Goals</span>
            <span>Review</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 p-6 rounded-2xl bg-card border border-border">
              <div>
                <h2 className="text-xl font-semibold mb-1">Campaign Details</h2>
                <p className="text-sm text-muted-foreground">
                  Tell clippers what your campaign is about
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Gaming Highlights Campaign"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="h-12 bg-secondary border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what kind of clips you're looking for..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="min-h-[120px] bg-secondary border-border resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleInputChange("category", cat)}
                        className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                          formData.category === cat
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Content</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <ImagePlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Drop your content here</p>
                    <p className="text-xs text-muted-foreground">
                      Upload videos or images for clippers to work with
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Budget & Goals */}
          {step === 2 && (
            <div className="space-y-6 p-6 rounded-2xl bg-card border border-border">
              <div>
                <h2 className="text-xl font-semibold mb-1">Budget & Goals</h2>
                <p className="text-sm text-muted-foreground">
                  Set your budget and performance targets
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Total Budget</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="budget"
                        type="number"
                        placeholder="5000"
                        value={formData.budget}
                        onChange={(e) => handleInputChange("budget", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpm">CPM Rate ($ per 1000 views)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="cpm"
                        type="number"
                        step="0.01"
                        placeholder="0.20"
                        value={formData.cpm}
                        onChange={(e) => handleInputChange("cpm", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetViews">Target Views</Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="targetViews"
                        placeholder="2,000,000"
                        value={formData.targetViews}
                        onChange={(e) => handleInputChange("targetViews", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Campaign Deadline</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => handleInputChange("deadline", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guidelines">Clipping Guidelines</Label>
                  <Textarea
                    id="guidelines"
                    placeholder="Any specific requirements or style guidelines for clippers..."
                    value={formData.guidelines}
                    onChange={(e) => handleInputChange("guidelines", e.target.value)}
                    className="min-h-[100px] bg-secondary border-border resize-none"
                  />
                </div>

                {/* Info box */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">How payouts work</p>
                    <p className="text-muted-foreground">
                      Clippers earn based on the views their clips generate. At ${formData.cpm || "0.20"} CPM, 
                      a clip with 100K views would earn ${((parseFloat(formData.cpm) || 0.20) * 100).toFixed(2)}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6 p-6 rounded-2xl bg-card border border-border">
              <div>
                <h2 className="text-xl font-semibold mb-1">Review & Launch</h2>
                <p className="text-sm text-muted-foreground">
                  Review your campaign details before going live
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Campaign Title</div>
                  <div className="font-medium">{formData.title || "Not set"}</div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Description</div>
                  <div className="font-medium">{formData.description || "Not set"}</div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Category</div>
                    <div className="font-medium">{formData.category || "Not set"}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Deadline</div>
                    <div className="font-medium">{formData.deadline || "Not set"}</div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-sm text-muted-foreground mb-1">Total Budget</div>
                    <div className="font-bold text-primary text-lg">
                      ${formData.budget || "0"}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">CPM Rate</div>
                    <div className="font-medium">${formData.cpm || "0.00"}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Target Views</div>
                    <div className="font-medium">{formData.targetViews || "Not set"}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary hover:opacity-90 glow-primary"
                >
                  Launch Campaign
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
};

export default Launch;