
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
    comments: string | null;
    references: string | null;
    contact: string | null;
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
    related_places: string | null;
    location_description: string | null;
    comments: string | null;
}

export interface Exvoto {
    id: number;
    internal_id: string | null;
    offering_sem_id: number | null;
    origin_sem_id: number | null;
    conservation_sem_id: number | null;
    province: string | null;
    virgin_or_saint: string | null;
    exvoto_date: string | null;
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
}

export interface Character {
    id: number;
    name: string;
}

export interface Miracle {
    id: number;
    name: string;
}

export interface CatalogSem {
    id: number;
    catalog_id: number;
    sem_id: number;
}

export type DataModel = Sem | Catalog | Exvoto;
