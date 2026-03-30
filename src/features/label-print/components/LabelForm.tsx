import type { LabelData, LabelSize } from "../types/label";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LabelFormProps {
  data: LabelData;
  onChange: (data: LabelData) => void;
}

export function LabelForm({ data, onChange }: LabelFormProps) {
  const update = <K extends keyof LabelData>(key: K, value: LabelData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-4">
      {/* Label size */}
      <div className="space-y-1.5">
        <Label>Yorliq o'lchami</Label>
        <div className="flex gap-2">
          {(["40x60", "60x80"] as LabelSize[]).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => update("labelSize", size)}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                data.labelSize === size
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-input hover:bg-accent"
              }`}
            >
              {size} mm
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="label-title">Sarlavha</Label>
        <Input
          id="label-title"
          placeholder='Masalan: "THREE LINE" MCHJ'
          value={data.title}
          onChange={(e) => update("title", e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Main code */}
      <div className="space-y-1.5">
        <Label htmlFor="label-code">Asosiy kod</Label>
        <Input
          id="label-code"
          placeholder="Masalan: 119220"
          value={data.mainCode}
          onChange={(e) => update("mainCode", e.target.value)}
          maxLength={50}
        />
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="label-location">Joylashuv</Label>
        <Input
          id="label-location"
          placeholder="Masalan: Toshkent"
          value={data.location}
          onChange={(e) => update("location", e.target.value)}
          maxLength={60}
        />
      </div>

      {/* QR value */}
      <div className="space-y-1.5">
        <Label htmlFor="label-qr">QR qiymati</Label>
        <Input
          id="label-qr"
          placeholder="QR kodga yoziladigan matn yoki URL"
          value={data.qrValue}
          onChange={(e) => update("qrValue", e.target.value)}
          maxLength={300}
        />
      </div>

      {/* Copies */}
      <div className="space-y-1.5">
        <Label htmlFor="label-copies">Nusxalar soni</Label>
        <Input
          id="label-copies"
          type="number"
          min={1}
          max={100}
          value={data.copies}
          onChange={(e) =>
            update("copies", Math.max(1, Math.min(100, Number(e.target.value) || 1)))
          }
          className="w-24"
        />
      </div>
    </div>
  );
}
