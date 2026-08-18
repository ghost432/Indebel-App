#!/usr/bin/env python3
"""
Script pour générer un fichier SQL d'importation optimisé
Résout les problèmes de contraintes de clés étrangères
"""

import re
import sys

def extract_constraints(create_table_sql):
    """Extrait les contraintes FOREIGN KEY d'une déclaration CREATE TABLE"""
    constraints = []
    lines = create_table_sql.split('\n')
    new_lines = []
    
    for line in lines:
        # Chercher les contraintes FOREIGN KEY
        if 'CONSTRAINT' in line and 'FOREIGN KEY' in line:
            constraints.append(line.strip())
        else:
            new_lines.append(line)
    
    # Nettoyer les virgules finales avant ENGINE=InnoDB
    result = '\n'.join(new_lines)
    # Remplacer ",\n) ENGINE=" par "\n) ENGINE="
    result = re.sub(r',(\s*\n\s*\))\s*(ENGINE=)', r'\1 \2', result)
    
    return result, constraints

def process_sql_file(input_file, output_file):
    """Traite le fichier SQL pour réorganiser les contraintes"""
    
    print(f"📖 Lecture de {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Initialisation
    all_constraints = []
    processed_content = []
    
    # En-tête optimisé pour phpMyAdmin
    header = """-- ============================================
-- FICHIER D'IMPORT OPTIMISÉ POUR PHPMYADMIN
-- Base: indebel_bd
-- Généré automatiquement
-- ============================================

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT=0;
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET CHARACTER_SET_CLIENT=utf8mb4;

"""
    
    processed_content.append(header)
    
    # Découper en sections (tables)
    print("🔄 Traitement des tables...")
    
    # Pattern pour trouver les CREATE TABLE
    table_pattern = re.compile(r'(DROP TABLE IF EXISTS `\w+`;.*?CREATE TABLE.*?;)', re.DOTALL)
    data_pattern = re.compile(r'(LOCK TABLES.*?UNLOCK TABLES;)', re.DOTALL)
    
    # Extraire toutes les sections de création de tables
    tables = table_pattern.findall(content)
    print(f"   Trouvé {len(tables)} tables")
    
    # Traiter chaque table pour extraire les contraintes
    for table_sql in tables:
        # Extraire le nom de la table
        table_name_match = re.search(r'CREATE TABLE `(\w+)`', table_sql)
        if table_name_match:
            table_name = table_name_match.group(1)
            print(f"   → Traitement de {table_name}...")
            
            # Extraire et retirer les contraintes FOREIGN KEY
            cleaned_sql, constraints = extract_constraints(table_sql)
            
            if constraints:
                print(f"      Trouvé {len(constraints)} contraintes")
                # Stocker les contraintes pour les ajouter à la fin
                for constraint in constraints:
                    # Nettoyer la contrainte (retirer la virgule finale)
                    constraint = constraint.rstrip(',')
                    all_constraints.append((table_name, constraint))
            
            # Ajouter la table nettoyée
            processed_content.append(cleaned_sql)
            processed_content.append("\n")
    
    # Extraire toutes les sections de données
    print("📊 Extraction des données...")
    data_sections = data_pattern.findall(content)
    print(f"   Trouvé {len(data_sections)} sections de données")
    
    for data_sql in data_sections:
        processed_content.append(data_sql)
        processed_content.append("\n")
    
    # Maintenant, ajouter toutes les contraintes à la fin
    if all_constraints:
        print(f"🔗 Ajout de {len(all_constraints)} contraintes à la fin...")
        processed_content.append("\n-- ============================================\n")
        processed_content.append("-- AJOUT DES CONTRAINTES DE CLÉS ÉTRANGÈRES\n")
        processed_content.append("-- ============================================\n\n")
        
        for table_name, constraint in all_constraints:
            # Extraire le nom de la contrainte
            constraint_name_match = re.search(r'CONSTRAINT `(\w+)`', constraint)
            if constraint_name_match:
                constraint_name = constraint_name_match.group(1)
                
                # Construire la commande ALTER TABLE
                # Extraire la partie FOREIGN KEY
                fk_match = re.search(r'FOREIGN KEY.*', constraint)
                if fk_match:
                    fk_clause = fk_match.group(0)
                    alter_sql = f"ALTER TABLE `{table_name}` ADD CONSTRAINT `{constraint_name}` {fk_clause};\n"
                    processed_content.append(alter_sql)
    
    # Footer
    footer = """
-- ============================================
-- FIN DE L'IMPORT
-- ============================================

SET FOREIGN_KEY_CHECKS=1;
COMMIT;
SET AUTOCOMMIT=1;
"""
    
    processed_content.append(footer)
    
    # Écrire le fichier de sortie
    print(f"💾 Écriture de {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(''.join(processed_content))
    
    print("✅ Fichier SQL optimisé généré avec succès!")
    print(f"📁 Fichier: {output_file}")
    print(f"📊 Statistiques:")
    print(f"   - {len(tables)} tables traitées")
    print(f"   - {len(data_sections)} sections de données")
    print(f"   - {len(all_constraints)} contraintes déplacées")

if __name__ == "__main__":
    input_file = "/home/thierry-ninja/CascadeProjects/windsurf-project-3/indebel/export_indebel_bd.sql"
    output_file = "/home/thierry-ninja/CascadeProjects/windsurf-project-3/indebel/IMPORT_PHPMYADMIN_OPTIMAL.sql"
    
    process_sql_file(input_file, output_file)
