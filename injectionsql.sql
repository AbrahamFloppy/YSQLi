--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6 (Ubuntu 16.6-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.6 (Ubuntu 16.6-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: useuario_id_seq; Type: SEQUENCE; Schema: public; Owner: yazi
--

CREATE SEQUENCE public.useuario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.useuario_id_seq OWNER TO yazi;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: usuario; Type: TABLE; Schema: public; Owner: yazi
--

CREATE TABLE public.usuario (
    id integer NOT NULL,
    nombre character varying NOT NULL,
    gmail character varying NOT NULL,
    contrasenha character varying NOT NULL
);


ALTER TABLE public.usuario OWNER TO yazi;

--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: yazi
--

COPY public.usuario (id, nombre, gmail, contrasenha) FROM stdin;
1	abraham	abraham@gmail.com	2701.Yazi
2	betsy	betsy@gmail.com	oiajiuqsguygs90
3	dailis	dailis@gmail.com	yTgfaygs-)9
4	bety	bety@gmail.com	Olahsu*7#
5	fernando	fernando@gmail.com	jshnujsg$57
6	yadira	yadira@gmail.com	)9Yfda_
7	landy	landy@gmail.com	landi_89
8	chacho	chacho@gmail.com	chgacho_09
9	tin	tin@gmail.com	TinTin_Caz0
10	liset	liset@gmail.com	40kilitos_
11	naomi	naomi@gmail.com	nao_ag1
\.


--
-- Name: useuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: yazi
--

SELECT pg_catalog.setval('public.useuario_id_seq', 1, false);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: yazi
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

