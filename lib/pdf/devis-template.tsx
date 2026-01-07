import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import { Devis } from '@/lib/types';

// Enregistrer une police système (optionnel, pour un meilleur rendu)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' },
  ],
});

// Styles du document
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f97316',
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  artisanInfo: {
    textAlign: 'right',
    maxWidth: '60%',
  },
  artisanName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  artisanDetail: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  // Titre Devis
  devisTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f97316',
    padding: 15,
    borderRadius: 4,
  },
  devisTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  devisNumber: {
    fontSize: 12,
    color: '#ffffff',
  },
  // Infos devis et client
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  infoBox: {
    width: '48%',
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#f97316',
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 3,
  },
  infoBold: {
    fontWeight: 'bold',
  },
  // Objet
  objetSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
  },
  objetTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  objetText: {
    fontSize: 10,
    color: '#78350f',
  },
  // Tableau
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  tableCellBold: {
    fontWeight: 'bold',
  },
  // Colonnes du tableau
  colDesignation: { width: '35%' },
  colQuantite: { width: '10%', textAlign: 'center' },
  colUnite: { width: '10%', textAlign: 'center' },
  colPrixUnit: { width: '15%', textAlign: 'right' },
  colTVA: { width: '10%', textAlign: 'center' },
  colTotal: { width: '20%', textAlign: 'right' },
  // Totaux
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 25,
  },
  totalsBox: {
    width: '40%',
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 10,
    color: '#1f2937',
  },
  totalTTC: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#f97316',
  },
  totalTTCLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalTTCValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f97316',
  },
  // Conditions
  conditionsSection: {
    marginBottom: 20,
  },
  conditionsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  conditionsText: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  // Mentions légales
  mentionsSection: {
    marginTop: 'auto',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  mentionText: {
    fontSize: 7,
    color: '#9ca3af',
    marginBottom: 2,
  },
  // Signature
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  signatureBox: {
    width: '45%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    minHeight: 80,
  },
  signatureTitle: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    marginTop: 40,
  },
  // Schéma du site
  sketchSection: {
    marginBottom: 20,
    marginTop: 10,
  },
  sketchTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sketchImage: {
    maxWidth: '100%',
    maxHeight: 300,
    objectFit: 'contain',
    borderRadius: 4,
    border: '1px solid #e5e7eb',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
  },
  pageNumber: {
    fontSize: 8,
    color: '#64748b',
  },
});

// Formater un montant en euros
const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// Formater une date
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
};

export interface DevisDocumentProps {
  devis: Devis;
}

/**
 * Composant Document PDF pour un devis
 */
export function DevisDocument({ devis }: DevisDocumentProps) {
  const { artisan, client, lignes } = devis;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header avec info artisan */}
        <View style={styles.header}>
          <View>
            {artisan?.logo ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={artisan.logo} style={styles.logo} />
            ) : (
              <View style={{ width: 80, height: 40 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#f97316' }}>
                  EOLIA
                </Text>
              </View>
            )}
          </View>
          <View style={styles.artisanInfo}>
            <Text style={styles.artisanName}>
              {artisan?.entreprise || `${artisan?.prenom} ${artisan?.nom}`}
            </Text>
            <Text style={styles.artisanDetail}>
              {artisan?.adresse}
            </Text>
            <Text style={styles.artisanDetail}>
              {artisan?.codePostal} {artisan?.ville}
            </Text>
            <Text style={styles.artisanDetail}>
              Tél: {artisan?.telephone}
            </Text>
            <Text style={styles.artisanDetail}>
              Email: {artisan?.email}
            </Text>
            <Text style={[styles.artisanDetail, { marginTop: 4 }]}>
              SIRET: {artisan?.siret}
            </Text>
          </View>
        </View>

        {/* Titre du devis */}
        <View style={styles.devisTitle}>
          <Text style={styles.devisTitleText}>DEVIS</Text>
          <View>
            <Text style={styles.devisNumber}>N° {devis.numero}</Text>
            <Text style={[styles.devisNumber, { fontSize: 10, marginTop: 2 }]}>
              Date: {formatDate(devis.date)}
            </Text>
          </View>
        </View>

        {/* Informations client et validité */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Client</Text>
            {client?.entreprise && (
              <Text style={[styles.infoText, styles.infoBold]}>
                {client.entreprise}
              </Text>
            )}
            <Text style={client?.entreprise ? styles.infoText : [styles.infoText, styles.infoBold]}>
              {client?.prenom} {client?.nom}
            </Text>
            <Text style={styles.infoText}>{client?.adresse}</Text>
            <Text style={styles.infoText}>
              {client?.codePostal} {client?.ville}
            </Text>
            {client?.telephone && (
              <Text style={styles.infoText}>Tél: {client.telephone}</Text>
            )}
            {client?.email && (
              <Text style={styles.infoText}>{client.email}</Text>
            )}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Validité</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Date d&apos;émission: </Text>
              {formatDate(devis.date)}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Valable jusqu&apos;au: </Text>
              {formatDate(devis.dateValidite)}
            </Text>
            {devis.delaiExecution && (
              <Text style={[styles.infoText, { marginTop: 8 }]}>
                <Text style={styles.infoBold}>Délai d&apos;exécution: </Text>
                {devis.delaiExecution}
              </Text>
            )}
          </View>
        </View>

        {/* Objet du devis */}
        <View style={styles.objetSection}>
          <Text style={styles.objetTitle}>Objet du devis</Text>
          <Text style={styles.objetText}>{devis.objet}</Text>
          {devis.description && (
            <Text style={[styles.objetText, { marginTop: 4, fontStyle: 'italic' }]}>
              {devis.description}
            </Text>
          )}
        </View>

        {/* Tableau des prestations */}
        <View style={styles.table}>
          {/* En-tête */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesignation]}>
              Désignation
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantite]}>Qté</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnite]}>Unité</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrixUnit]}>P.U. HT</Text>
            <Text style={[styles.tableHeaderCell, styles.colTVA]}>TVA</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total TTC</Text>
          </View>

          {/* Lignes */}
          {lignes.map((ligne, index) => (
            <View
              key={ligne.id}
              style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
            >
              <View style={styles.colDesignation}>
                <Text style={[styles.tableCell, styles.tableCellBold]}>
                  {ligne.designation}
                </Text>
                {ligne.description && (
                  <Text style={[styles.tableCell, { fontStyle: 'italic', marginTop: 2 }]}>
                    {ligne.description}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.colQuantite]}>
                {ligne.quantite}
              </Text>
              <Text style={[styles.tableCell, styles.colUnite]}>{ligne.unite}</Text>
              <Text style={[styles.tableCell, styles.colPrixUnit]}>
                {formatPrice(ligne.prixUnitaireHT)}
              </Text>
              <Text style={[styles.tableCell, styles.colTVA]}>
                {ligne.tauxTVA}%
              </Text>
              <Text style={[styles.tableCell, styles.tableCellBold, styles.colTotal]}>
                {formatPrice(ligne.montantTTC)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{formatPrice(devis.totalHT)}</Text>
            </View>
            {devis.detailTVA.map((tva) => (
              <View key={tva.taux} style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA {tva.taux}%</Text>
                <Text style={styles.totalValue}>{formatPrice(tva.montantTVA)}</Text>
              </View>
            ))}
            <View style={styles.totalTTC}>
              <Text style={styles.totalTTCLabel}>Total TTC</Text>
              <Text style={styles.totalTTCValue}>{formatPrice(devis.totalTTC)}</Text>
            </View>
          </View>
        </View>

        {/* Conditions */}
        {(devis.conditionsPaiement || devis.notes) && (
          <View style={styles.conditionsSection}>
            <Text style={styles.conditionsTitle}>Conditions</Text>
            {devis.conditionsPaiement && (
              <Text style={styles.conditionsText}>
                <Text style={{ fontWeight: 'bold' }}>Paiement: </Text>
                {devis.conditionsPaiement}
              </Text>
            )}
            {devis.notes && (
              <Text style={styles.conditionsText}>
                <Text style={{ fontWeight: 'bold' }}>Notes: </Text>
                {devis.notes}
              </Text>
            )}
          </View>
        )}

        {/* Schéma du site (si présent) */}
        {devis.sketchUrl && (
          <View style={styles.sketchSection}>
            <Text style={styles.sketchTitle}>📐 Schéma du site</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={devis.sketchUrl} style={styles.sketchImage} />
          </View>
        )}

        {/* Zones de signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>
              Bon pour accord - Date et signature du client:
            </Text>
            <Text style={[styles.signatureTitle, { marginTop: 4, fontStyle: 'italic' }]}>
              Mention manuscrite &quot;Bon pour accord&quot;
            </Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>
              Signature de l&apos;artisan:
            </Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        {/* Mentions légales */}
        <View style={styles.mentionsSection}>
          {devis.mentionsLegales.map((mention, index) => (
            <Text key={index} style={styles.mentionText}>
              • {mention}
            </Text>
          ))}
        </View>

        {/* Footer avec numéro de page */}
        <View style={styles.footer} fixed>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export default DevisDocument;
