--
-- PostgreSQL database dump
--

\restrict vhPQzBqa2ThQ1DFW8OYFjpRovNCdL4PLn8MfL6SofibZjzitM4ONpO2OsPZ1ySL

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg13+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg13+2)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alert_history; Type: TABLE; Schema: public; Owner: riceguard
--

CREATE TABLE public.alert_history (
    id integer NOT NULL,
    alert_id integer NOT NULL,
    action character varying(80) NOT NULL,
    old_status character varying(30),
    new_status character varying(30),
    changed_by integer,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.alert_history OWNER TO riceguard;

--
-- Name: alert_history_id_seq; Type: SEQUENCE; Schema: public; Owner: riceguard
--

CREATE SEQUENCE public.alert_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alert_history_id_seq OWNER TO riceguard;

--
-- Name: alert_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riceguard
--

ALTER SEQUENCE public.alert_history_id_seq OWNED BY public.alert_history.id;


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: riceguard
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    feature_id integer,
    field_id integer,
    alert_type character varying(80) DEFAULT 'AGRICULTURE'::character varying NOT NULL,
    category character varying(80) DEFAULT 'agriculture'::character varying NOT NULL,
    severity character varying(30) DEFAULT 'medium'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    ip_address inet,
    status character varying(30) DEFAULT 'new'::character varying NOT NULL,
    predicted_at timestamp with time zone,
    lead_time_minutes integer,
    source_workflow character varying(20),
    region character varying(150),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by integer,
    resolution_note text,
    CONSTRAINT alerts_status_check CHECK (((status)::text = ANY ((ARRAY['new'::character varying, 'reviewing'::character varying, 'resolved'::character varying, 'ignored'::character varying])::text[])))
);


ALTER TABLE public.alerts OWNER TO riceguard;

--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: riceguard
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alerts_id_seq OWNER TO riceguard;

--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riceguard
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: fields; Type: TABLE; Schema: public; Owner: riceguard
--

CREATE TABLE public.fields (
    id integer NOT NULL,
    owner_id integer,
    name character varying(150) NOT NULL,
    location text,
    region character varying(150),
    latitude numeric(10,7),
    longitude numeric(10,7),
    area_hectares numeric(12,3),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.fields OWNER TO riceguard;

--
-- Name: fields_id_seq; Type: SEQUENCE; Schema: public; Owner: riceguard
--

CREATE SEQUENCE public.fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fields_id_seq OWNER TO riceguard;

--
-- Name: fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riceguard
--

ALTER SEQUENCE public.fields_id_seq OWNED BY public.fields.id;


--
-- Name: iot_sensors; Type: TABLE; Schema: public; Owner: riceguard
--

CREATE TABLE public.iot_sensors (
    id bigint NOT NULL,
    field_id integer,
    sensor_code character varying(120) NOT NULL,
    sensor_type character varying(80),
    last_seen_at timestamp with time zone,
    status character varying(30) DEFAULT 'unknown'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.iot_sensors OWNER TO riceguard;

--
-- Name: iot_sensors_id_seq; Type: SEQUENCE; Schema: public; Owner: riceguard
--

CREATE SEQUENCE public.iot_sensors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.iot_sensors_id_seq OWNER TO riceguard;

--
-- Name: iot_sensors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riceguard
--

ALTER SEQUENCE public.iot_sensors_id_seq OWNED BY public.iot_sensors.id;


--
-- Name: ndvi_records; Type: TABLE; Schema: public; Owner: riceguard
--

CREATE TABLE public.ndvi_records (
    id bigint NOT NULL,
    field_id integer,
    region character varying(150),
    ndvi_value numeric(8,5),
    source character varying(100),
    source_record_id character varying(255),
    payload_hash text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    suspicious boolean DEFAULT false NOT NULL,
    suspicious_reason text
);


ALTER TABLE public.ndvi_records OWNER TO riceguard;

--
-- Name: ndvi_records_id_seq; Type: SEQUENCE; Schema: public; Owner: riceguard
--

CREATE SEQUENCE public.ndvi_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ndvi_records_id_seq OWNER TO riceguard;

--
-- Name: ndvi_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riceguard
--

ALTER SEQUENCE public.ndvi_records_id_seq OWNED BY public.ndvi_records.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: riceguard
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    user_id integer,
    field_id integer,
    title character varying(255) NOT NULL,
    description text,
    image_url text,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    ai_analysis text,
    ai_severity character varying(30),
    ai_disease character varying(150),
    reviewed_by integer,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reports OWNER TO riceguard;

--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: riceguard
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO riceguard;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riceguard
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: riceguard
--

CREATE TABLE public.support_messages (
    id bigint NOT NULL,
    farmer_id integer,
    admin_id integer,
    conversation_id character varying(120),
    sender_role character varying(30) NOT NULL,
    message text NOT NULL,
    status character varying(30) DEFAULT 'open'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.support_messages OWNER TO riceguard;

--
-- Name: support_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: riceguard
--

CREATE SEQUENCE public.support_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_messages_id_seq OWNER TO riceguard;

--
-- Name: support_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riceguard
--

ALTER SEQUENCE public.support_messages_id_seq OWNED BY public.support_messages.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: riceguard
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash text NOT NULL,
    email character varying(255),
    full_name character varying(255),
    role character varying(50) DEFAULT 'viewer'::character varying NOT NULL,
    telegram_chat_id character varying(100),
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO riceguard;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: riceguard
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO riceguard;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riceguard
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: weather_records; Type: TABLE; Schema: public; Owner: riceguard
--

CREATE TABLE public.weather_records (
    id bigint NOT NULL,
    region character varying(150) NOT NULL,
    source character varying(100),
    temperature_c numeric(6,2),
    rainfall_mm numeric(8,2),
    wind_speed_kmh numeric(8,2),
    condition_text character varying(150),
    is_severe boolean DEFAULT false NOT NULL,
    observed_at timestamp with time zone DEFAULT now() NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.weather_records OWNER TO riceguard;

--
-- Name: weather_records_id_seq; Type: SEQUENCE; Schema: public; Owner: riceguard
--

CREATE SEQUENCE public.weather_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.weather_records_id_seq OWNER TO riceguard;

--
-- Name: weather_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riceguard
--

ALTER SEQUENCE public.weather_records_id_seq OWNED BY public.weather_records.id;


--
-- Name: alert_history id; Type: DEFAULT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.alert_history ALTER COLUMN id SET DEFAULT nextval('public.alert_history_id_seq'::regclass);


--
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- Name: fields id; Type: DEFAULT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.fields ALTER COLUMN id SET DEFAULT nextval('public.fields_id_seq'::regclass);


--
-- Name: iot_sensors id; Type: DEFAULT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.iot_sensors ALTER COLUMN id SET DEFAULT nextval('public.iot_sensors_id_seq'::regclass);


--
-- Name: ndvi_records id; Type: DEFAULT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.ndvi_records ALTER COLUMN id SET DEFAULT nextval('public.ndvi_records_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: support_messages id; Type: DEFAULT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.support_messages ALTER COLUMN id SET DEFAULT nextval('public.support_messages_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: weather_records id; Type: DEFAULT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.weather_records ALTER COLUMN id SET DEFAULT nextval('public.weather_records_id_seq'::regclass);


--
-- Data for Name: alert_history; Type: TABLE DATA; Schema: public; Owner: riceguard
--

COPY public.alert_history (id, alert_id, action, old_status, new_status, changed_by, note, created_at) FROM stdin;
1	1	CREATED	\N	new	\N	Auto từ D4	2026-10-16 20:39:55.737676+00
2	2	CREATED	\N	new	\N	Auto từ D4	2026-10-16 20:40:01.243516+00
\.


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: riceguard
--

COPY public.alerts (id, feature_id, field_id, alert_type, category, severity, title, description, ip_address, status, predicted_at, lead_time_minutes, source_workflow, region, metadata, created_at, updated_at, resolved_at, resolved_by, resolution_note) FROM stdin;
1	\N	3	IOT_OFFLINE	agriculture	medium	SENSOR-A1	Không gửi dữ liệu 46 phút	\N	new	\N	\N	D4	Quảng Nam	{"sensor_id": "5", "minutes_ago": 46, "sensor_code": "SENSOR-A1"}	2026-10-16 20:28:05.934491+00	2026-10-16 20:28:05.934491+00	\N	\N	\N
2	\N	3	IOT_OFFLINE	agriculture	medium	SENSOR-A1	Không gửi dữ liệu 61 phút	\N	new	\N	\N	D4	Quảng Nam	{"sensor_id": "5", "minutes_ago": 61, "sensor_code": "SENSOR-A1"}	2026-10-16 20:40:01.234983+00	2026-10-16 20:40:01.234983+00	\N	\N	\N
\.


--
-- Data for Name: fields; Type: TABLE DATA; Schema: public; Owner: riceguard
--

COPY public.fields (id, owner_id, name, location, region, latitude, longitude, area_hectares, created_at, updated_at) FROM stdin;
3	2	Ruộng A1	Thôn 1	Quảng Nam	15.5737000	108.4740000	1.500	2026-10-16 20:22:43.849543+00	2026-10-16 20:22:43.849543+00
4	3	Ruộng B2	Thôn 2	Quảng Nam	15.5800000	108.4800000	2.000	2026-10-16 20:22:43.849543+00	2026-10-16 20:22:43.849543+00
\.


--
-- Data for Name: iot_sensors; Type: TABLE DATA; Schema: public; Owner: riceguard
--

COPY public.iot_sensors (id, field_id, sensor_code, sensor_type, last_seen_at, status, created_at, updated_at) FROM stdin;
5	3	SENSOR-A1	soil_moisture	2026-10-16 19:38:56.309906+00	active	2026-10-16 20:23:56.309906+00	2026-10-16 20:23:56.309906+00
6	4	SENSOR-B2	soil_moisture	2026-10-16 20:18:56.309906+00	active	2026-10-16 20:23:56.309906+00	2026-10-16 20:23:56.309906+00
\.


--
-- Data for Name: ndvi_records; Type: TABLE DATA; Schema: public; Owner: riceguard
--

COPY public.ndvi_records (id, field_id, region, ndvi_value, source, source_record_id, payload_hash, payload, received_at, suspicious, suspicious_reason) FROM stdin;
3	3	Quảng Nam	0.65000	sentinel-2	S2_20260101	abc123hash	{}	2026-10-16 20:24:01.854377+00	f	\N
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: riceguard
--

COPY public.reports (id, user_id, field_id, title, description, image_url, status, ai_analysis, ai_severity, ai_disease, reviewed_by, reviewed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: support_messages; Type: TABLE DATA; Schema: public; Owner: riceguard
--

COPY public.support_messages (id, farmer_id, admin_id, conversation_id, sender_role, message, status, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: riceguard
--

COPY public.users (id, username, password_hash, email, full_name, role, telegram_chat_id, last_login, created_at) FROM stdin;
1	admin	$2b$10$Q2C.sIIGa0VD/iQDYABD8.FAST6TH2NQU.IdWaQMWp.mXpOyZMlBS	admin@riceguard.local	RiceGuard Admin	admin	\N	2026-10-16 16:49:53.028633	2026-10-16 08:37:52.315471
2	nva	hashed_pw_a	a@test.com	Nguyễn Văn A	farmer	123456789	\N	2026-10-16 20:21:50.687251
3	ttb	hashed_pw_b	b@test.com	Trần Thị B	farmer	987654321	\N	2026-10-16 20:21:50.687251
\.


--
-- Data for Name: weather_records; Type: TABLE DATA; Schema: public; Owner: riceguard
--

COPY public.weather_records (id, region, source, temperature_c, rainfall_mm, wind_speed_kmh, condition_text, is_severe, observed_at, payload) FROM stdin;
\.


--
-- Name: alert_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riceguard
--

SELECT pg_catalog.setval('public.alert_history_id_seq', 2, true);


--
-- Name: alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riceguard
--

SELECT pg_catalog.setval('public.alerts_id_seq', 2, true);


--
-- Name: fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riceguard
--

SELECT pg_catalog.setval('public.fields_id_seq', 4, true);


--
-- Name: iot_sensors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riceguard
--

SELECT pg_catalog.setval('public.iot_sensors_id_seq', 6, true);


--
-- Name: ndvi_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riceguard
--

SELECT pg_catalog.setval('public.ndvi_records_id_seq', 3, true);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riceguard
--

SELECT pg_catalog.setval('public.reports_id_seq', 1, false);


--
-- Name: support_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riceguard
--

SELECT pg_catalog.setval('public.support_messages_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riceguard
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: weather_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riceguard
--

SELECT pg_catalog.setval('public.weather_records_id_seq', 1, false);


--
-- Name: alert_history alert_history_pkey; Type: CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.alert_history
    ADD CONSTRAINT alert_history_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: fields fields_pkey; Type: CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.fields
    ADD CONSTRAINT fields_pkey PRIMARY KEY (id);


--
-- Name: iot_sensors iot_sensors_pkey; Type: CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.iot_sensors
    ADD CONSTRAINT iot_sensors_pkey PRIMARY KEY (id);


--
-- Name: iot_sensors iot_sensors_sensor_code_key; Type: CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.iot_sensors
    ADD CONSTRAINT iot_sensors_sensor_code_key UNIQUE (sensor_code);


--
-- Name: ndvi_records ndvi_records_pkey; Type: CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.ndvi_records
    ADD CONSTRAINT ndvi_records_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: weather_records weather_records_pkey; Type: CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.weather_records
    ADD CONSTRAINT weather_records_pkey PRIMARY KEY (id);


--
-- Name: idx_alerts_category_type; Type: INDEX; Schema: public; Owner: riceguard
--

CREATE INDEX idx_alerts_category_type ON public.alerts USING btree (category, alert_type);


--
-- Name: idx_alerts_status_created; Type: INDEX; Schema: public; Owner: riceguard
--

CREATE INDEX idx_alerts_status_created ON public.alerts USING btree (status, created_at DESC);


--
-- Name: idx_ndvi_field_received; Type: INDEX; Schema: public; Owner: riceguard
--

CREATE INDEX idx_ndvi_field_received ON public.ndvi_records USING btree (field_id, received_at DESC);


--
-- Name: idx_reports_field_created; Type: INDEX; Schema: public; Owner: riceguard
--

CREATE INDEX idx_reports_field_created ON public.reports USING btree (field_id, created_at DESC);


--
-- Name: idx_reports_user_created; Type: INDEX; Schema: public; Owner: riceguard
--

CREATE INDEX idx_reports_user_created ON public.reports USING btree (user_id, created_at DESC);


--
-- Name: idx_sensors_last_seen; Type: INDEX; Schema: public; Owner: riceguard
--

CREATE INDEX idx_sensors_last_seen ON public.iot_sensors USING btree (last_seen_at);


--
-- Name: idx_support_conversation; Type: INDEX; Schema: public; Owner: riceguard
--

CREATE INDEX idx_support_conversation ON public.support_messages USING btree (conversation_id, created_at);


--
-- Name: idx_weather_region_observed; Type: INDEX; Schema: public; Owner: riceguard
--

CREATE INDEX idx_weather_region_observed ON public.weather_records USING btree (region, observed_at DESC);


--
-- Name: alert_history alert_history_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.alert_history
    ADD CONSTRAINT alert_history_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id) ON DELETE CASCADE;


--
-- Name: alert_history alert_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.alert_history
    ADD CONSTRAINT alert_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: alerts alerts_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.fields(id) ON DELETE SET NULL;


--
-- Name: alerts alerts_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: fields fields_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.fields
    ADD CONSTRAINT fields_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: iot_sensors iot_sensors_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.iot_sensors
    ADD CONSTRAINT iot_sensors_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.fields(id) ON DELETE SET NULL;


--
-- Name: ndvi_records ndvi_records_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.ndvi_records
    ADD CONSTRAINT ndvi_records_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.fields(id) ON DELETE SET NULL;


--
-- Name: reports reports_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.fields(id) ON DELETE SET NULL;


--
-- Name: reports reports_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: support_messages support_messages_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: support_messages support_messages_farmer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riceguard
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_farmer_id_fkey FOREIGN KEY (farmer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict vhPQzBqa2ThQ1DFW8OYFjpRovNCdL4PLn8MfL6SofibZjzitM4ONpO2OsPZ1ySL

