"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { UserProfile } from "@/types/domain";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(1, "Age is required"),
  height: z.coerce.number().min(1, "Height is required"),
  weight: z.coerce.number().min(1, "Weight is required"),
  targetPhysique: z.string().optional(),
  dietaryPreferences: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function BiometricsCard() {
  const profile = useAtlasStore((state) => state.profile);
  const updateProfile = useAtlasStore((state) => state.updateProfile);
  const units = useAtlasStore((state) => state.units);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name,
      age: profile?.age,
      height: profile?.height,
      weight: profile?.weight,
      targetPhysique: profile?.targetPhysique,
      dietaryPreferences: profile?.dietaryPreferences,
    },
  });

  if (!profile) return null;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Biometrics</h2>
          <p className="text-sm text-zinc-500">Your physical characteristics</p>
        </div>
        <Button size="icon" variant="secondary" onClick={() => setIsEditing(!isEditing)}>
          <Pencil size={18} />
        </Button>
      </div>

      {isEditing ? (
        <form
          onSubmit={handleSubmit(async (values) => {
            await updateProfile(values);
            setIsEditing(false);
          })}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Age</Label>
              <Input type="number" {...register("age")} />
              {errors.age && <p className="mt-1 text-xs text-rose-300">{errors.age.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Height ({units === "imperial" ? "in" : "cm"})</Label>
              <Input type="number" {...register("height")} />
              {errors.height && <p className="mt-1 text-xs text-rose-300">{errors.height.message}</p>}
            </div>
            <div>
              <Label>Weight ({units === "imperial" ? "lbs" : "kg"})</Label>
              <Input type="number" {...register("weight")} />
              {errors.weight && <p className="mt-1 text-xs text-rose-300">{errors.weight.message}</p>}
            </div>
          </div>
          <div>
            <Label>Target Physique</Label>
            <Input {...register("targetPhysique")} />
          </div>
          <div>
            <Label>Dietary Preferences</Label>
            <Input {...register("dietaryPreferences")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <BiometricStat label="Age" value={profile.age} />
            <BiometricStat label="Height" value={profile.height} unit={units === "imperial" ? "in" : "cm"} />
            <BiometricStat label="Weight" value={profile.weight} unit={units === "imperial" ? "lbs" : "kg"} />
          </div>
          {profile.targetPhysique && (
            <div className="mt-3">
              <BiometricStat label="Target Physique" value={profile.targetPhysique} />
            </div>
          )}
          {profile.dietaryPreferences && (
            <div className="mt-3">
              <BiometricStat label="Dietary Preferences" value={profile.dietaryPreferences} />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function BiometricStat({ label, value, unit }: { label: string; value?: string | number; unit?: string }) {
  return (
    <Surface className="flex items-baseline justify-between rounded-lg p-3">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-lg font-semibold text-white">
        {value ?? "N/A"}
        {unit ? <span className="ml-1 text-sm text-zinc-500">{unit}</span> : null}
      </p>
    </Surface>
  );
}