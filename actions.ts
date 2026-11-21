"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const field = (name: string, max: number) => String(formData.get(name) ?? "").trim().slice(0, max);
  const first_name = field("first_name", 60);
  const phone = field("phone", 30);

  if (!first_name) redirect("/dashboard?section=parametres&erreur=nom");
  if (phone && !/^[+0-9 ()-]{6,30}$/.test(phone)) redirect("/dashboard?section=parametres&erreur=telephone");

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name,
      last_name: field("last_name", 60),
      post_name: field("post_name", 60),
      phone,
      city: field("city", 80),
      country: field("country", 80),
    })
    .eq("id", user.id);

  if (error) redirect("/dashboard?section=parametres&erreur=enregistrement");
  redirect("/dashboard?section=parametres&ok=profil");
}
