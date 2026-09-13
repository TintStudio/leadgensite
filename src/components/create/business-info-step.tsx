import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WebsiteCreationFormData } from "@/types/create";

interface StepProps {
  data: WebsiteCreationFormData;
  updateData: (fields: Partial<WebsiteCreationFormData>) => void;
}

export function BusinessInfoStep({ data, updateData }: StepProps) {
  return (
    <div className="space-y-6">
      {/* Business & Website Name */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            placeholder="e.g. Apex Restoration Pros"
            value={data.business_name}
            onChange={(e) => {
              const name = e.target.value;
              updateData({
                business_name: name,
                website_name: data.website_name || name,
              });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website_name">Website / Brand Name</Label>
          <Input
            id="website_name"
            placeholder="e.g. Apex Restoration Arvada"
            value={data.website_name}
            onChange={(e) => updateData({ website_name: e.target.value })}
          />
        </div>
      </div>

      {/* Phone & Email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. (303) 555-0199"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Business Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="e.g. info@apexrestoration.com"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
          />
        </div>
      </div>

      {/* Service Type / Industry & Years in Business */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="service_type">Service Type / Industry</Label>
          <Input
            id="service_type"
            placeholder="e.g. Water Damage Restoration, Roofing, Plumbing"
            value={data.service_type}
            onChange={(e) => updateData({ service_type: e.target.value, niche: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="years_in_business">Years in Business</Label>
          <Input
            id="years_in_business"
            placeholder="e.g. 15 Years, Since 2008"
            value={data.years_in_business}
            onChange={(e) => updateData({ years_in_business: e.target.value })}
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Business Address</Label>
        <Input
          id="address"
          placeholder="e.g. 7890 Ralston Road"
          value={data.address}
          onChange={(e) => updateData({ address: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="e.g. Arvada"
            value={data.city}
            onChange={(e) => updateData({ city: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            placeholder="e.g. CO"
            value={data.state}
            onChange={(e) => updateData({ state: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input
            id="zip"
            placeholder="e.g. 80002"
            value={data.zip}
            onChange={(e) => updateData({ zip: e.target.value })}
          />
        </div>
      </div>

      {/* Business Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Business Description</Label>
        <Textarea
          id="description"
          placeholder="Detailed overview of company services, guarantees, emergency readiness, etc."
          rows={3}
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
        />
      </div>

      {/* Background / Additional Information */}
      <div className="space-y-2">
        <Label htmlFor="background_info">Background / Additional Information (Optional)</Label>
        <Textarea
          id="background_info"
          placeholder="Any special certifications, awards, family-owned history, or specific equipment details..."
          rows={3}
          value={data.background_info}
          onChange={(e) => updateData({ background_info: e.target.value })}
        />
      </div>
    </div>
  );
}
