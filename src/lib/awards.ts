export type AwardCategory = {
  id: string;
  number: number;
  stage: 1 | 2;
  area: string;
  title: string;
  nominees: string[];
};

export const AWARD_CATEGORIES: AwardCategory[] = [
  {
    id: "cat-1",
    number: 1,
    stage: 1,
    area: "Destaque do Ano",
    title: "GOAT DA TEMPORADA 2025",
    nominees: [
      "CAMILA SILVA",
      "MARIA LUIZA NAZARIO",
      "RENAN YASUOKA",
      "JASON DAIR & GIOVANA BORGHI",
      "ERICK FERIOLI & RAYANE QUINTEIRO",
      "FABIANA CABRAL & EMERSON GABRIEL",
      "JULIANA SMACH",
      "TAMIRES LEITE",
      "ISABELA MOTA",
      "BEATRIZ RODRIGUES",
      "IZABELLA DE LUNA - Recife",
      "FERNANDA CONTADOR - Curitiba",
      "BRUNA DALBEM - POA",
      "KATIA CORREIA",
      "PATRICIA BAHIA",
      "DANIELLE CORREA",
      "VINICIUS PATRIOTA - Time Danilo Turlão",
      "MARIA HELENA ROCHA - Time Luciana Finatti",
      "CARLOS MARQUES - PEDRO BARROS",
      "GUSTAVO PINTO - SERGIO FRIDMAN",
    ]
  }
];

export const ASSETS = [
  "1-Eletro-Conveno-LOGO-1.png",
  "1-Eletro-Conveno-LOGO-2.png",
  "1-Eletro-Conveno-LOGO-3.png",
  "2-Eletro-Conveno-Tema-1.png",
  "2-Eletro-Conveno-Tema-2.png",
  "2-Eletro-Conveno-Tema-3.png",
  "3-Eletro-Conveno-Mote-1.png",
  "3-Eletro-Conveno-Mote-2.png",
  "3-Eletro-Conveno-Mote-3.png",
  "4-Eletro-Conveno-Grafismos-1.png",
  "4-Eletro-Conveno-Grafismos-10.png",
  "4-Eletro-Conveno-Grafismos-11.png",
  "4-Eletro-Conveno-Grafismos-12.png",
  "4-Eletro-Conveno-Grafismos-13.png",
  "4-Eletro-Conveno-Grafismos-14.png",
  "4-Eletro-Conveno-Grafismos-15.png",
  "4-Eletro-Conveno-Grafismos-16.png",
  "4-Eletro-Conveno-Grafismos-2.png",
  "4-Eletro-Conveno-Grafismos-3.png",
  "4-Eletro-Conveno-Grafismos-4.png",
  "4-Eletro-Conveno-Grafismos-5.png",
  "4-Eletro-Conveno-Grafismos-6.png",
  "4-Eletro-Conveno-Grafismos-7.png",
  "4-Eletro-Conveno-Grafismos-8.png",
  "4-Eletro-Conveno-Grafismos-9.png"
];

export const LOGIN_LOGO = "1-Eletro-Conveno-LOGO-2.png";
export const LEAGUE_LOGO = "2-Eletro-Conveno-Tema-1.png";
export const SUCCESS_MOTE = "3-Eletro-Conveno-Mote-2.png";
