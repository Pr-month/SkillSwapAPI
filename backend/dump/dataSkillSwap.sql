PGDMP  )    ,                }         	   SkillSwap    17.4    17.4     �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    25501 	   SkillSwap    DATABASE     q   CREATE DATABASE "SkillSwap" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'ru-RU';
    DROP DATABASE "SkillSwap";
                     admin    false            �            1259    25518    user    TABLE       CREATE TABLE public."user" (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    age integer NOT NULL,
    city character varying NOT NULL,
    "aboutMe" character varying NOT NULL,
    gender character varying NOT NULL,
    skills character varying NOT NULL,
    "wantToLearn" character varying NOT NULL,
    "favoriteSkills" character varying NOT NULL,
    role character varying DEFAULT 'USER'::character varying NOT NULL
);
    DROP TABLE public."user";
       public         heap r       admin    false            �            1259    25517    user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 "   DROP SEQUENCE public.user_id_seq;
       public               admin    false    218            �           0    0    user_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;
          public               admin    false    217            !           2604    25521    user id    DEFAULT     d   ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);
 8   ALTER TABLE public."user" ALTER COLUMN id DROP DEFAULT;
       public               admin    false    217    218    218            �          0    25518    user 
   TABLE DATA           �   COPY public."user" (id, name, email, password, age, city, "aboutMe", gender, skills, "wantToLearn", "favoriteSkills", role) FROM stdin;
    public               admin    false    218   �       �           0    0    user_id_seq    SEQUENCE SET     9   SELECT pg_catalog.setval('public.user_id_seq', 4, true);
          public               admin    false    217            $           2606    25526 #   user PK_cace4a159ff9f2512dd42373760 
   CONSTRAINT     e   ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id);
 Q   ALTER TABLE ONLY public."user" DROP CONSTRAINT "PK_cace4a159ff9f2512dd42373760";
       public                 admin    false    218            &           2606    25528 #   user UQ_e12875dfb3b1d92d7d7c5377e22 
   CONSTRAINT     c   ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE (email);
 Q   ALTER TABLE ONLY public."user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22";
       public                 admin    false    218            �   I  x�u��J�@��7O�H�M\**Z�"Mu%��h�Ф���Tp��F|��ZS�g8�Fޤv13w�8ߜ�3L�B��%}M��n�E�i���ݢ�p�Y͹���BxA��c��gy�f�V-UUD*뉼mr��̘���DO���xZ��1#��Z��z�G:6�+�����G$�%:�XB���Jx��c����x��!>�S9�����l1l �!&<��p�����iT1E��N��bZ 	Oi����%tE����>�:�80�~�Ax�7�!�xd>.lʞPd�_ڑ�z�ӥ}�kZ�L���r�P9�+��!��     