
exports.getCategories = async (req, res) => {
    try {
        // Récupérer les catégories distinctes depuis les deux tables de missions
        const [categories] = await db.query(`
      SELECT DISTINCT categorie as nom 
      FROM (
        SELECT categorie FROM missions_forfait_horaire 
        UNION 
        SELECT categorie FROM missions_forfait_fixe
      ) AS all_categories 
      WHERE categorie IS NOT NULL AND categorie != ''
      ORDER BY categorie ASC
    `);

        // Transformer en format attendu avec id et nom
        const formattedCategories = categories.map((cat, index) => ({
            id: index + 1,
            nom: cat.nom
        }));

        res.json({
            success: true,
            data: formattedCategories
        });

    } catch (error) {
        console.error('Erreur récupération catégories:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des catégories'
        });
    }
};
