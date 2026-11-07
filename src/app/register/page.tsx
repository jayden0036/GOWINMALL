"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/site-url";

export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    postName: "",
    email: "",
    phone: "",
    country: "République démocratique du Congo",
    city: "",
    gender: "",
    accountType: "particulier",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });

  function updateField(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const target = e.target;

    setForm({
      ...form,
      [target.name]:
        target.type === "checkbox" && "checked" in target
          ? target.checked
          : target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    if (form.password.length < 12) {
      setMessage("Utilisez au moins 12 caractères pour votre mot de passe.");
      return;
    }

    if (!form.acceptedTerms) {
      setMessage("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    setMessage("Création du compte…");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          post_name: form.postName,
          phone: form.phone,
          country: form.country,
          city: form.city,
          gender: form.gender,
          account_type: form.accountType,
          accepted_terms: form.acceptedTerms,
        },
      },
    });

    if (error) {
      setMessage("Impossible de créer le compte : " + error.message);
      return;
    }

    setMessage(
      "Compte créé. Vérifiez votre boîte e-mail pour confirmer votre adresse, puis connectez-vous."
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px",
    border: "1px solid #dce4df",
    borderRadius: "10px",
    fontSize: "15px",
    marginTop: "7px",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 600,
    marginBottom: "17px",
    color: "#26352d",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f8f5",
        padding: "35px 15px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          margin: "auto",
          background: "white",
          padding: "30px 22px",
          borderRadius: "18px",
          boxShadow: "0 8px 35px #0000000d",
        }}
      >
        <h1 style={{ color: "#087443", textAlign: "center" }}>GOWINMALL</h1>

        <h2 style={{ textAlign: "center", color: "#172d22" }}>
          Créer votre compte
        </h2>

        <p style={{ textAlign: "center", color: "#68766e" }}>
          Rejoignez les opportunités de toute l'Afrique.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            Nom *
            <input
              name="lastName"
              value={form.lastName}
              onChange={updateField}
              placeholder="Votre nom"
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            Postnom
            <input
              name="postName"
              value={form.postName}
              onChange={updateField}
              placeholder="Votre postnom"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Prénom *
            <input
              name="firstName"
              value={form.firstName}
              onChange={updateField}
              placeholder="Votre prénom"
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            Adresse e-mail *
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              placeholder="exemple@email.com"
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            Numéro de téléphone *
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={updateField}
              placeholder="+243..."
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            Pays *
            <input
              name="country"
              value={form.country}
              onChange={updateField}
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            Ville *
            <input
              name="city"
              value={form.city}
              onChange={updateField}
              placeholder="Exemple : Kinshasa"
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            Genre (facultatif)
            <select
              name="gender"
              value={form.gender}
              onChange={updateField}
              style={inputStyle}
            >
              <option value="">Ne pas préciser</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="autre">Autre</option>
            </select>
          </label>

          <label style={labelStyle}>
            Type de compte *
            <select
              name="accountType"
              value={form.accountType}
              onChange={updateField}
              style={inputStyle}
              required
            >
              <option value="particulier">Particulier</option>
              <option value="vendeur">Vendeur</option>
              <option value="entreprise">Entreprise</option>
              <option value="prestataire">Prestataire de services</option>
              <option value="affilie">Affilié</option>
            </select>
          </label>

          <label style={labelStyle}>
            Mot de passe *
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder="12 caractères minimum"
              style={inputStyle}
              minLength={12}
              required
            />
          </label>

          <label style={labelStyle}>
            Confirmer le mot de passe *
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={updateField}
              placeholder="Confirmez votre mot de passe"
              style={inputStyle}
              required
            />
          </label>

          <div
            style={{
              background: "#edf7f0",
              padding: "16px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            <strong>Vérification d'identité</strong>
            <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
              Après votre inscription, vous pourrez accéder à une procédure
              sécurisée de vérification avec une pièce d'identité acceptée par
              GOWINMALL.
            </p>
          </div>

          <label
            style={{
              display: "flex",
              gap: "10px",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            <input
              type="checkbox"
              name="acceptedTerms"
              checked={form.acceptedTerms}
              onChange={updateField}
            />
            J'accepte les conditions d'utilisation et la politique de
            confidentialité.
          </label>

          {message && (
            <p
              role="status"
              style={{
                background: "#fff4df",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "16px",
              background: "#087443",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Créer mon compte →
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#68766e",
            marginTop: "22px",
          }}
        >
          Déjà membre ? Connectez-vous.
        </p>
      </div>
    </main>
  );
}
