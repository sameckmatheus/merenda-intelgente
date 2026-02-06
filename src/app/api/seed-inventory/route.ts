import { NextResponse } from 'next/server';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const inventoryCategories = ["Todos", "Estocáveis", "Proteínas", "Hortifruti", "Material de Limpeza", "Outros"];

        const inventoryItems = [
            // Estocáveis
            { id: '1', name: 'Arroz Branco', category: 'Estocáveis', unit: 'kg', minQuantity: 20 },
            { id: '2', name: 'Arroz Parboilizado', category: 'Estocáveis', unit: 'kg', minQuantity: 20 },
            { id: '3', name: 'Feijão Carioca', category: 'Estocáveis', unit: 'kg', minQuantity: 20 },
            { id: '4', name: 'Feijão Preto', category: 'Estocáveis', unit: 'kg', minQuantity: 10 },
            { id: '5', name: 'Macarrão Espaguete', category: 'Estocáveis', unit: 'kg', minQuantity: 15 },
            { id: '6', name: 'Macarrão Parafuso', category: 'Estocáveis', unit: 'kg', minQuantity: 15 },
            { id: '7', name: 'Flocão de Milho (Cuscuz)', category: 'Estocáveis', unit: 'kg', minQuantity: 20 },
            { id: '8', name: 'Açúcar Cristal', category: 'Estocáveis', unit: 'kg', minQuantity: 15 },
            { id: '9', name: 'Sal Refinado', category: 'Estocáveis', unit: 'kg', minQuantity: 5 },
            { id: '10', name: 'Óleo de Soja', category: 'Estocáveis', unit: 'L', minQuantity: 10 },
            { id: '11', name: 'Leite em Pó Integral', category: 'Estocáveis', unit: 'kg', minQuantity: 10 },
            { id: '12', name: 'Bolacha Salgada (Cream Cracker)', category: 'Estocáveis', unit: 'pct', minQuantity: 20 },
            { id: '13', name: 'Bolacha Doce (Maisena)', category: 'Estocáveis', unit: 'pct', minQuantity: 20 },
            { id: '14', name: 'Café em Pó', category: 'Estocáveis', unit: 'kg', minQuantity: 5 },
            { id: '15', name: 'Colorau', category: 'Estocáveis', unit: 'kg', minQuantity: 1 },
            { id: '16', name: 'Vinagre', category: 'Estocáveis', unit: 'L', minQuantity: 5 },
            { id: '17', name: 'Sardinha em Lata', category: 'Estocáveis', unit: 'unid', minQuantity: 10 },

            // Proteínas
            { id: '30', name: 'Carne Moída (Bovina)', category: 'Proteínas', unit: 'kg', minQuantity: 10 },
            { id: '31', name: 'Carne em Cubos (Bovina)', category: 'Proteínas', unit: 'kg', minQuantity: 10 },
            { id: '32', name: 'Peito de Frango', category: 'Proteínas', unit: 'kg', minQuantity: 15 },
            { id: '33', name: 'Coxa e Sobrecoxa de Frango', category: 'Proteínas', unit: 'kg', minQuantity: 15 },
            { id: '34', name: 'Ovos Brancos', category: 'Proteínas', unit: 'cartela', minQuantity: 5 },
            { id: '35', name: 'Filé de Peixe', category: 'Proteínas', unit: 'kg', minQuantity: 10 },
            { id: '36', name: 'Fígado Bovino', category: 'Proteínas', unit: 'kg', minQuantity: 5 },

            // Hortifruti
            { id: '50', name: 'Batata Inglesa', category: 'Hortifruti', unit: 'kg', minQuantity: 10 },
            { id: '51', name: 'Batata Doce', category: 'Hortifruti', unit: 'kg', minQuantity: 10 },
            { id: '52', name: 'Cenoura', category: 'Hortifruti', unit: 'kg', minQuantity: 10 },
            { id: '53', name: 'Beterraba', category: 'Hortifruti', unit: 'kg', minQuantity: 5 },
            { id: '54', name: 'Tomate', category: 'Hortifruti', unit: 'kg', minQuantity: 10 },
            { id: '55', name: 'Cebola Branca', category: 'Hortifruti', unit: 'kg', minQuantity: 10 },
            { id: '56', name: 'Alho', category: 'Hortifruti', unit: 'kg', minQuantity: 2 },
            { id: '57', name: 'Pimentão', category: 'Hortifruti', unit: 'kg', minQuantity: 2 },
            { id: '58', name: 'Repolho Verde', category: 'Hortifruti', unit: 'kg', minQuantity: 5 },
            { id: '59', name: 'Abóbora (Jerimum)', category: 'Hortifruti', unit: 'kg', minQuantity: 10 },
            { id: '60', name: 'Macaxeira', category: 'Hortifruti', unit: 'kg', minQuantity: 10 },
            { id: '61', name: 'Banana Prata', category: 'Hortifruti', unit: 'kg', minQuantity: 15 },
            { id: '62', name: 'Melancia', category: 'Hortifruti', unit: 'kg', minQuantity: 10 },
            { id: '63', name: 'Mamão', category: 'Hortifruti', unit: 'kg', minQuantity: 10 },
            { id: '64', name: 'Laranja', category: 'Hortifruti', unit: 'kg', minQuantity: 15 },
            { id: '65', name: 'Maçã', category: 'Hortifruti', unit: 'kg', minQuantity: 10 },

            // Material de Limpeza
            { id: '80', name: 'Detergente Líquido', category: 'Material de Limpeza', unit: 'unid', minQuantity: 10 },
            { id: '81', name: 'Água Sanitária', category: 'Material de Limpeza', unit: 'L', minQuantity: 10 },
            { id: '82', name: 'Sabão em Pó', category: 'Material de Limpeza', unit: 'kg', minQuantity: 5 },
            { id: '83', name: 'Sabão em Barra', category: 'Material de Limpeza', unit: 'unid', minQuantity: 10 },
            { id: '84', name: 'Esponja de Lã de Aço', category: 'Material de Limpeza', unit: 'pct', minQuantity: 5 },
            { id: '85', name: 'Esponja Dupla Face', category: 'Material de Limpeza', unit: 'unid', minQuantity: 10 },
            { id: '86', name: 'Pano de Prato', category: 'Material de Limpeza', unit: 'unid', minQuantity: 5 },
            { id: '87', name: 'Vassoura de Pelo', category: 'Material de Limpeza', unit: 'unid', minQuantity: 2 },
            { id: '88', name: 'Rodo', category: 'Material de Limpeza', unit: 'unid', minQuantity: 2 },
            { id: '89', name: 'Pano de Chão', category: 'Material de Limpeza', unit: 'unid', minQuantity: 5 },
            { id: '90', name: 'Desinfetante', category: 'Material de Limpeza', unit: 'L', minQuantity: 5 },
        ];

        const newData = {
            inventoryCategories,
            inventoryItems
        };

        const current = await db.select().from(systemSettings).where(eq(systemSettings.id, 'general')).limit(1);

        if (current.length > 0) {
            const existingData = current[0].data as any;
            await db.update(systemSettings).set({
                data: { ...existingData, ...newData },
                updatedAt: new Date()
            }).where(eq(systemSettings.id, 'general'));
        } else {
            await db.insert(systemSettings).values({
                id: 'general',
                data: newData,
                updatedAt: new Date()
            });
        }

        return NextResponse.json({ success: true, message: 'Inventory seeded successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
