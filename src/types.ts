
export interface Sem {
    id: number;
    name: string | null;
    region: string | null;
    province: string | null;
    town: string | null;
    associated_divinity: string | null;
    festivity: string | null;
    pictorial_exvoto_count: number | null;
    oldest_exvoto_date: string | null;
    newest_exvoto_date: string | null;
    other_exvotos: string | null;
    numero_exvotos: number | null;
    comments: string | null;
    references: string | null;
    contact: string | null;
    updated_at?: string | null;
}

export interface Catalog {
    id: number;
    title: string | null;
    reference: string | null;
    author: string | null;
    publication_year: number | null;
    publication_place: string | null;
    catalog_location: string | null;
    exvoto_count: number | null;
    location_description: string | null;
    oldest_exvoto_date: string | null;
    newest_exvoto_date: string | null;
    other_exvotos: string | null;
    numero_exvotos: number | null;
    comments: string | null;
    updated_at?: string | null;
}

export interface Exvoto {
    id: number;
    internal_id: string | null;
    offering_sem_id: number | null;
    lugar_origen: string | null;
    conservation_sem_id: number | null;
    province: string | null;
    virgin_or_saint: string | null;
    exvoto_date: string | null;
    epoch: string | null;
    benefited_name: string | null;
    offerer_name: string | null;
    offerer_gender: string | null;
    offerer_relation: string | null;
    characters: string | null;
    profession: string | null;
    social_status: string | null;
    miracle: string | null;
    miracle_place: string | null;
    material: string | null;
    dimensions: string | null;
    text_case: string | null;
    text_form: string | null;
    extra_info: string | null;
    transcription: string | null;
    conservation_status: string | null;
    image: string | null; // Using string to represent blob data placeholder
    updated_at?: string | null;
}

export interface Divinity {
    id: number;
    name: string;
    attributes: string | null;
    history: string | null;
    representation: string | null;
    representation_image: string | null; // Using string to represent blob data placeholder
    comments: string | null;
    updated_at?: string | null;
}

export interface Character {
    id: number;
    name: string;
    updated_at?: string | null;
}

export interface ExvotoImage {
    id: number;
    exvoto_id: number;
    image: string; // data URL o base64 normalizada
    caption: string | null;
    updated_at?: string | null;
}

export interface Miracle {
    id: number;
    name: string;
    updated_at?: string | null;
}

export interface CatalogSem {
    id: number;
    catalog_id: number;
    sem_id: number;
}

export type DataModel = Sem | Catalog | Exvoto;
