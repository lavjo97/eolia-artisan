import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour rechercher les informations d'une entreprise via son SIRET
 * Utilise l'API publique de l'INSEE (Sirene)
 */

interface SireneEtablissement {
  siret: string;
  uniteLegale: {
    denominationUniteLegale?: string;
    nomUniteLegale?: string;
    prenomUsuelUniteLegale?: string;
    categorieJuridiqueUniteLegale?: string;
  };
  adresseEtablissement: {
    numeroVoieEtablissement?: string;
    typeVoieEtablissement?: string;
    libelleVoieEtablissement?: string;
    codePostalEtablissement?: string;
    libelleCommuneEtablissement?: string;
    codeCommuneEtablissement?: string;
  };
}

interface SireneResponse {
  etablissement?: SireneEtablissement;
  header?: {
    statut: number;
    message: string;
  };
}

// Token API Insee (à configurer dans .env.local)
const INSEE_API_KEY = process.env.INSEE_API_KEY;

// API publique alternative si pas de clé INSEE
const ENTREPRISE_API_URL = 'https://entreprise.data.gouv.fr/api/sirene/v3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siret: string }> }
) {
  try {
    const { siret } = await params;

    // Valider le format SIRET
    const cleanSiret = siret.replace(/\s/g, '');
    if (!/^\d{14}$/.test(cleanSiret)) {
      return NextResponse.json(
        { error: 'Format SIRET invalide. Le SIRET doit contenir exactement 14 chiffres.' },
        { status: 400 }
      );
    }

    let data: {
      denomination: string;
      adresse: string;
      codePostal: string;
      ville: string;
    } | null = null;

    // Essayer l'API officielle INSEE si on a une clé
    if (INSEE_API_KEY) {
      try {
        const response = await fetch(
          `https://api.insee.fr/entreprises/sirene/V3/siret/${cleanSiret}`,
          {
            headers: {
              'Authorization': `Bearer ${INSEE_API_KEY}`,
              'Accept': 'application/json',
            },
          }
        );

        if (response.ok) {
          const result: SireneResponse = await response.json();
          const etab = result.etablissement;

          if (etab) {
            const ul = etab.uniteLegale;
            const adr = etab.adresseEtablissement;

            // Construire le nom de l'entreprise
            let denomination = ul.denominationUniteLegale || '';
            if (!denomination && ul.nomUniteLegale) {
              denomination = `${ul.prenomUsuelUniteLegale || ''} ${ul.nomUniteLegale}`.trim();
            }

            // Construire l'adresse
            const adresseComposants = [
              adr.numeroVoieEtablissement,
              adr.typeVoieEtablissement,
              adr.libelleVoieEtablissement,
            ].filter(Boolean);

            data = {
              denomination,
              adresse: adresseComposants.join(' '),
              codePostal: adr.codePostalEtablissement || '',
              ville: adr.libelleCommuneEtablissement || '',
            };
          }
        }
      } catch (error) {
        console.error('INSEE API error:', error);
        // Continuer avec l'API alternative
      }
    }

    // Fallback: API publique data.gouv.fr
    if (!data) {
      try {
        const response = await fetch(
          `${ENTREPRISE_API_URL}/etablissements/${cleanSiret}`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          const etab = result.etablissement;

          if (etab) {
            // Construire les données à partir de la réponse
            let denomination = '';
            if (etab.unite_legale) {
              denomination = etab.unite_legale.denomination || 
                            `${etab.unite_legale.prenom_usuel || ''} ${etab.unite_legale.nom || ''}`.trim();
            }

            const adresseComposants = [
              etab.numero_voie,
              etab.type_voie,
              etab.libelle_voie,
            ].filter(Boolean);

            data = {
              denomination,
              adresse: adresseComposants.join(' '),
              codePostal: etab.code_postal || '',
              ville: etab.libelle_commune || '',
            };
          }
        } else if (response.status === 404) {
          return NextResponse.json(
            { error: 'SIRET non trouvé. Vérifiez le numéro et réessayez.' },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error('Data.gouv API error:', error);
      }
    }

    // Dernière tentative: API recherche-entreprises
    if (!data) {
      try {
        const siren = cleanSiret.substring(0, 9);
        const response = await fetch(
          `https://recherche-entreprises.api.gouv.fr/search?q=${siren}&page=1&per_page=1`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.results && result.results.length > 0) {
            const entreprise = result.results[0];
            const siege = entreprise.siege;

            data = {
              denomination: entreprise.nom_complet || entreprise.nom_raison_sociale || '',
              adresse: siege?.adresse || '',
              codePostal: siege?.code_postal || '',
              ville: siege?.libelle_commune || '',
            };
          }
        }
      } catch (error) {
        console.error('Recherche-entreprises API error:', error);
      }
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Impossible de récupérer les informations. Vérifiez le SIRET ou saisissez manuellement.' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('SIRET lookup error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur. Veuillez réessayer.' },
      { status: 500 }
    );
  }
}
