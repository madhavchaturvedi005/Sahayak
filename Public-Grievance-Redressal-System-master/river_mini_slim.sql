-- MySQL dump 10.13  Distrib 8.0.12, for Win64 (x86_64)
--
-- Host: localhost    Database: river_mini
-- ------------------------------------------------------
-- Server version	8.0.12

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 SET NAMES utf8mb4 ;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `complainant`
--

DROP TABLE IF EXISTS `complainant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `complainant` (
  `uidai_no` int(5) DEFAULT NULL,
  `f_name` varchar(10) DEFAULT NULL,
  `m_name` varchar(10) DEFAULT NULL,
  `l_name` varchar(10) DEFAULT NULL,
  `email_id` varchar(30) DEFAULT NULL,
  `DOB` date DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `contact_no` int(10) DEFAULT NULL,
  `cmp_id` varchar(20) NOT NULL,
  `uname` varchar(10) DEFAULT NULL,
  `pass` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`cmp_id`),
  UNIQUE KEY `uname_UNIQUE` (`uname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complainant`
--

LOCK TABLES `complainant` WRITE;
/*!40000 ALTER TABLE `complainant` DISABLE KEYS */;
INSERT INTO `complainant` VALUES (123453,'Pranav','D','Badhe','badhe@gmail.com',NULL,'male',2134,'CPL001','usr001','pass'),(873237,'Pankaj','A','Rathi','ask@gmail.com',NULL,'male',2145,'CPL002','usr002','pro'),(746233,'Praj','F','Mali','praj@hotmail.com',NULL,'female',2554,'CPL003','usr003','pro'),(242634,'Das','K','Rathi','rath.1@gmail.com',NULL,'male',2314,'CPL004','usr004','pro'),(142435,'Rajesh','M','Mishra','Mishra',NULL,'male',983922,'CPL005','usr005','pro'),(142435,'Rajesh','M','Mishra','Mishra',NULL,'male',983922,'CPL006','usr006','pro'),(12314,'Pravasti','K','Sahara','Sahara',NULL,'male',98312,'CPL007','usr007','pro'),(12434,'Ram','Mishra','Patil','Patil',NULL,'male',134141,'CPL008','usr008','pro'),(1314,'Parth','D','Datta','Datta',NULL,'male',12432,'CPL009','usr009','pro'),(92643,'lpkg','KKJGAF','dshf','dshf',NULL,'male',23451,'CPL010','usr010','pro'),(121212,'tejas','d','Abhang','Abhang',NULL,'male',23232,'CPL011',NULL,NULL);
/*!40000 ALTER TABLE `complainant` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tg_compl` BEFORE INSERT ON `complainant` FOR EACH ROW begin
insert into complainant_seq values (null);
set new.cmp_id = concat('CPL',lpad(last_insert_id(),3,'0'));
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `complainant_seq`
--

DROP TABLE IF EXISTS `complainant_seq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `complainant_seq` (
  `comp_id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`comp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complainant_seq`
--

LOCK TABLES `complainant_seq` WRITE;
/*!40000 ALTER TABLE `complainant_seq` DISABLE KEYS */;
INSERT INTO `complainant_seq` VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11);
/*!40000 ALTER TABLE `complainant_seq` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint`
--

DROP TABLE IF EXISTS `complaint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `complaint` (
  `comments` varchar(50) DEFAULT NULL,
  `status` varchar(10) DEFAULT NULL,
  `type` varchar(40) DEFAULT NULL,
  `site_no_fk` int(11) NOT NULL,
  `affect` varchar(40) DEFAULT NULL,
  `gen` varchar(40) DEFAULT NULL,
  `distance` varchar(40) DEFAULT NULL,
  `complainant_id` varchar(45) NOT NULL,
  `severity` int(11) DEFAULT NULL,
  `s_id_fk` varchar(45) DEFAULT NULL,
  `img_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`complainant_id`,`site_no_fk`),
  KEY `ibfk1_idx` (`complainant_id`),
  KEY `ibfk2_idx` (`s_id_fk`),
  KEY `ibfk3` (`site_no_fk`),
  CONSTRAINT `ibfk1` FOREIGN KEY (`complainant_id`) REFERENCES `complainant` (`cmp_id`),
  CONSTRAINT `ibfk2` FOREIGN KEY (`s_id_fk`) REFERENCES `surveyor` (`s_id`),
  CONSTRAINT `ibfk3` FOREIGN KEY (`site_no_fk`) REFERENCES `site` (`site_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint`
--

LOCK TABLES `complaint` WRITE;
/*!40000 ALTER TABLE `complaint` DISABLE KEYS */;
INSERT INTO `complaint` VALUES ('afgvwg','Inactive','River Weed',60,'Spoiling Scenic Beauty','Unknown','0 - 100 metres','CPL001',3,NULL,32),('davfaag','Inactive','Industrial Waste Toxic Foam',62,'Spreading Diseases','Unknown','0 - 100 metres','CPL001',5,NULL,34),('davfaag','Inactive','Industrial Waste Toxic Foam Toxic Foam',63,'Spreading Diseases','Unknown','0 - 100 metres','CPL001',5,NULL,35),('All about ChemIndustries','Inactive','Untreated Sewage',66,'Spreading Diseases','ChemIndustries','100 - 500 metres','CPL001',3,NULL,38),('The river weed needs to be looked at','Ongoing','River Weed',67,'Foul Smell','Unknown','0 - 100 metres','CPL001',3,'SR002',39),('ushdug','Inactive','Industrial Waste Decolourisation',58,'Spreading Diseases','Unknown','0 - 100 metres','CPL002',5,'SR002',30),('agytv	','Inactive','River Weed',59,'Deteriorating Air Quality','Unknown','100 - 500 metres','CPL002',3,'SR003',31),('dsfaef','Inactive','Untreated Sewage',64,'Deteriorating Air Quality','Unknown','100 - 500 metres','CPL002',3,NULL,36),('fhisgks','Closed','Untreated Sewage',65,'Spoiling Scenic Beauty','ds','500 + metres','CPL002',1,'SR001',37),('Needs to be taken  care of','Inactive','Construction Debris',68,'Deteriorating Air Quality','Unknown','100 - 500 metres','CPL002',3,'SR003',40),('Severe troubles caused','Suspended','Untreated Sewage',69,'mosquitoes','Unknown','500 + metres','CPL002',1,'SR001',41),('Severe troubles caused','Inactive','Untreated Sewage',72,'Foul Smell','Unknown','100 - 500 metres','CPL002',1,'SR001',44),('Severe troubles caused','Ongoing','Untreated Sewage',73,'Foul Smell','Unknown','100 - 500 metres','CPL002',1,'SR002',45),('Severe troubles caused','Inactive','Untreated Sewage',74,'Foul Smell','Unknown','100 - 500 metres','CPL002',1,'SR003',46),('Severe troubles caused','Suspended','River Weed',76,'Spreading Diseases','Unknown','500 + metres','CPL002',3,'SR002',48),('Severe troubles caused','Inactive','Industrial Waste Toxic Foam',77,'Deteriorating Air Quality','Unknown','100 - 500 metres','CPL002',3,'SR003',49),('Severe troubles caused','Inactive','Industrial Waste Toxic Foam Toxic Foam',78,'Deteriorating Air Quality','Unknown','100 - 500 metres','CPL002',3,'SR001',50),('ksjdfhudhf','Inactive','Construction Debris',80,'Foul Smell','Unknown','500 + metres','CPL002',1,'SR002',52),('Podfeiufae','Inactive','Waste Dump Electronic',81,'Deteriorating Air Quality','Chem','0 - 100 metres','CPL002',5,'SR003',53),('podfjsidjfk','Inactive','Untreated Sewage',82,'mosquitoes','ChemINdus ','100 - 500 metres','CPL002',1,'SR001',54),('Progeamafod','Inactive','River Weed',83,'Spoiling Scenic Beauty','Unknown','100 - 500 metres','CPL002',1,'SR002',55),('koli wapar','Inactive','Untreated Sewage',84,'Not Affecting','PvtLtd','0 - 100 metres','CPL002',3,'SR003',56),('koli wapar','Closed','Waste Dump Workshop',85,'Deteriorating Air Quality','Unknown','100 - 500 metres','CPL002',3,'SR001',57),('dfwefefe','Inactive','Untreated Sewage',86,'Foul Smell','Unknown','0 - 100 metres','CPL002',4,'SR002',58),('ytffytfiy','Inactive','River Weed',61,'Deteriorating Air Quality','Unknown','100 - 500 metres','CPL004',3,NULL,33);
/*!40000 ALTER TABLE `complaint` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `complaint_BEFORE_INSERT` BEFORE INSERT ON `complaint` FOR EACH ROW BEGIN
	declare sv int;
    declare dist varchar(50);
    
    set sv = 1;
	
    if(new.affect = 'Deteriorating Air Quality' or new.affect = 'Spreading Diseases')
    then set sv = sv + 2;
    
	elseif(new.affect like 'Foul%' or new.affect like 'Mosquitoes%')
	then set sv = sv + 1;

	end if;
    
    if(new.distance like '0 - 100 metres')
    then set sv = sv + 2;
    
    elseif(new.distance like '100 - 500 metres%')
    then set sv = sv + 1;
    
    end if;
    
    set new.severity = sv;
    
    
    
    
    set dist = (select district from site where site_no = new.site_no_fk);
    
    set new.s_id_fk = (select s_id from surveyor where district like dist and avail = (select min(avail) from surveyor) limit 1);

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `complaint_AFTER_INSERT` AFTER INSERT ON `complaint` FOR EACH ROW BEGIN
	update surveyor set avail = avail + 1 where s_id = new.s_id_fk;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `image`
--

DROP TABLE IF EXISTS `image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `image` (
  `image_id` int(11) NOT NULL AUTO_INCREMENT,
  `image` longblob,
  PRIMARY KEY (`image_id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `image`
--


--
-- Table structure for table `site`
--

DROP TABLE IF EXISTS `site`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `site` (
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `district` varchar(20) DEFAULT NULL,
  `street` varchar(20) DEFAULT NULL,
  `locality` varchar(20) DEFAULT NULL,
  `site_no` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`site_no`)
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site`
--

LOCK TABLES `site` WRITE;
/*!40000 ALTER TABLE `site` DISABLE KEYS */;
INSERT INTO `site` VALUES (18.727868,75.408683,'i8yb8o','rers','ytri7out',1),(18.507831,75.928607,' fwef','asfq','qwfw',2),(20.812268,76.443118,'w ertt','qwrd','wef ',3),(19.531297,74.188138,'8eyg8w','pushfn','siuhf7',4),(20.750129,74.16003,'sbhbf ','rajgad marg','fhieo',5),(18.033505,75.937527,'e5yy5w','qwrq ',' wr qfwgr',6),(19.71926,73.16777,'i gygieiuf ','afu ','ur uf hsige',7),(19.739759,72.845816,'erstg 3rwvr','WF E','W4 VFZArgq',8),(18.980443,76.834618,' ersf q','aefv w',' rtertqf',9),(20.256106,76.793733,'v rg et','awd qer','we vfergcwr q',10),(20.863898,78.293879,' 8urwghf','af ew6d ','iu wureh qy',11),(19.692681,76.072329,'wefwegve','adfqf','edefwfe',12),(19.976865,74.167779,'iue ','weyt f yt',' yugeihq',13),(20.95469,77.919405,'igigwgqr i','daf 78','wkjebfuywbf',14),(19.758609,75.895174,'UBSGVB','aeygluf','jhsb',15),(19.829677,75.967959,'utftft ','yrddasdyx','uguuygy',16),(18.172043,75.15235,'ugwseudf','hasfus','ygsjhygfv',17),(18.774673,74.799288,'1ubsrkg','jhjsgd','iugwiurg',18),(20.697702,77.345963,'iugwsrifg','hateyfd','uygwfuir',19),(19.696534,76.23656,'IUUGWSRIDUFGV','juygew','iygsdfiuvg',20),(19.459777,76.974581,'iugwrfskugb','jhsdfg','1iuhweifu',21),(19.459777,76.974581,'iugwrfskugb','jhsdfg','1iuhweifu',22),(18.184355,75.15603,'IYDGIWYAeHFIU','kjhsdfg','iygsridgfiy',23),(20.940582,77.359103,'gtuutqctc','mhqawfg','iygqwgiy',24),(20.655144,78.245743,'gf ','wjeahvd','grdfyuWSga ry',25),(18.545334,73.959884,'Pune','iygyfy','ihsh99',26),(19.749561,75.978945,'edw','sf','wsf',27),(18.831028,76.414101,'Pune','afc','wsg',28),(18.976104,73.766912,'wgw','afaef','EQEFGS',29),(19.345409,76.956212,'Pune','afefqaefewsww','SGQA',30),(18.751756,74.174341,'Pune','af','qfeq',31),(18.473401,76.07899,'Pune','wef','fds',32),(19.986404,75.32365,'Pune','sg','regq',33),(19.80513,75.724886,'Pune','af','fa',34),(18.93961,76.030388,'Pune','aafg','gishiuhf',35),(19.75242,75.503701,'Pune','afaef','iwibi',36),(19.75242,75.503701,'Pune','afaef','iwibi',37),(19.712074,76.04349,'Pune','giyigy','yhugt',38),(19.712074,76.04349,'Pune','giyigy','yhugt',39),(19.712074,76.04349,'Pune','giyigy','yhugt',40),(19.712074,76.04349,'Pune','giyigy','yhugt',41),(19.712074,76.04349,'Pune','giyigy','yhugt',42),(19.712074,76.04349,'Pune','giyigy','yhugt',43),(19.712074,76.04349,'Pune','giyigy','yhugt',44),(19.712074,76.04349,'Pune','giyigy','yhugt',45),(19.712074,76.04349,'Pune','giyigy','yhugt',46),(19.712074,76.04349,'Pune','giyigy','yhugt',47),(19.774117,75.778445,'Pune','MJSGD','WUDYGUY',48),(19.774117,75.778445,'Pune','MJSGD','WUDYGUY',49),(19.774117,75.778445,'Pune','MJSGD','WUDYGUY',50),(19.774117,75.778445,'Pune','MJSGD','WUDYGUY',51),(19.774117,75.778445,'Pune','MJSGD','WUDYGUY',52),(19.774117,75.778445,'Pune','MJSGD','WUDYGUY',53),(19.774117,75.778445,'Pune','MJSGD','WUDYGUY',54),(19.774117,75.778445,'Pune','MJSGD','WUDYGUY',55),(19.941384,76.233004,'Pune','af','fuhwsgo',56),(19.269499,73.000104,'Mumbai','egfv','oiujws',57),(20.144174,77.463577,'Tejas','champa','ijdf',58),(18.348128,74.100291,'Pune','af','asdkdfb',59),(19.356022,72.678203,'Mumbai','adhyd','hsdgb',60),(20.243176,73.89017,'Nashik','trxgtssw','tdtuf',61),(19.78964,72.878005,'Mumbai','aef','gvhyb',62),(19.78964,72.878005,'Mumbai','aef','gvhyb',63),(20.178796,73.82436,'Nashik','dtgd','ygyigyf',64),(18.629636,73.87369,'Pune','dgsvg','iusg',65),(17.151545,74.250095,'Kolhapur','Rajpath Lane','Rajiv Nagar',66),(18.72639,73.816943,'Pune','Lajwant Street','M.G. Road',67),(18.322639,74.012709,'Pune','Kole','Wish Nagar',68),(18.840402,73.807176,'Pune','Wiliwonka','Gruhi Nagar',69),(18.840402,73.807176,'Pune','Wiliwonka','Gruhi Nagar',70),(18.840402,73.807176,'Pune','Wiliwonka','Gruhi Nagar',71),(18.840402,73.807176,'Pune','Wiliwonka','Gruhi Nagar',72),(18.840402,73.807176,'Pune','Wiliwonka','Gruhi Nagar',73),(18.840402,73.807176,'Pune','Wiliwonka','Gruhi Nagar',74),(18.840402,73.807176,'Pune','Wiliwonka','Gruhi Nagar',75),(18.460718,73.997901,'Pune','Jai','Gruhi Nagar',76),(18.875575,74.66374,'Pune','Rahi Nagar','Rama Nagar',77),(18.875575,74.66374,'Pune','Rahi Nagar','Rama Nagar',78),(18.875575,74.66374,'Pune','Rahi Nagar','Rama Nagar',79),(18.512476,74.29941,'Pune','Ram Nagar','Lol Nagar',80),(18.056093,73.859957,'Pune','Ram Nagar','Lajpat Marg',81),(18.728509,73.796786,'Pune','Lal Marg','Poster Marg',82),(18.7103,74.458712,'Pune','Path Marg','Laser Love',83),(18.408739,73.801113,'Pune','Poster Porter','Muli Nagar',84),(18.757595,74.024037,'Pune','Lonely Nagar','Lost Story',85),(18.330091,73.824427,'Pune','adfq','wefe',86);
/*!40000 ALTER TABLE `site` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `surveyor`
--

DROP TABLE IF EXISTS `surveyor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `surveyor` (
  `s_id` varchar(10) NOT NULL,
  `f_name` varchar(10) DEFAULT NULL,
  `m_name` varchar(10) DEFAULT NULL,
  `l_name` varchar(10) DEFAULT NULL,
  `email_id` varchar(30) DEFAULT NULL,
  `gender` varchar(40) DEFAULT NULL,
  `street` varchar(20) DEFAULT NULL,
  `locality` varchar(20) DEFAULT NULL,
  `district` varchar(20) DEFAULT NULL,
  `contact_no` double DEFAULT NULL,
  `uname` varchar(45) DEFAULT NULL,
  `pass` varchar(45) DEFAULT NULL,
  `avail` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`s_id`),
  UNIQUE KEY `s_id` (`s_id`),
  UNIQUE KEY `uname_UNIQUE` (`uname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surveyor`
--

LOCK TABLES `surveyor` WRITE;
/*!40000 ALTER TABLE `surveyor` DISABLE KEYS */;
INSERT INTO `surveyor` VALUES ('SR001','Pranav','D','Badhe','pbd@gmail.com','Male','Rambaug Colony','Kothrud','Pune',9877668832,'svr001','pass',7),('SR002','Siddhi','D','D','sd@gmail.com','Female','Dhankawdi','Katraj','Pune',9848737272,'svr002','pro',7),('SR003','Tejas','ksui','8y','iueh','iushf`iq`','uiiuisfv','iuhg','Pune',297495555,'svr003','pro',6);
/*!40000 ALTER TABLE `surveyor` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tg_s_id` BEFORE INSERT ON `surveyor` FOR EACH ROW begin
insert into surveyor_seq values (null);
set new.s_id = concat('SR',lpad(last_insert_id(),3,'0'));
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `surveyor_seq`
--

DROP TABLE IF EXISTS `surveyor_seq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `surveyor_seq` (
  `s_id_gen` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`s_id_gen`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surveyor_seq`
--

LOCK TABLES `surveyor_seq` WRITE;
/*!40000 ALTER TABLE `surveyor_seq` DISABLE KEYS */;
INSERT INTO `surveyor_seq` VALUES (1),(2),(3);
/*!40000 ALTER TABLE `surveyor_seq` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `surveys`
--

DROP TABLE IF EXISTS `surveys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `surveys` (
  `site_no_fk` int(11) DEFAULT NULL,
  `s_id_fk` varchar(20) DEFAULT NULL,
  `z_id_fk` varchar(20) DEFAULT NULL,
  `work_area` int(11) DEFAULT NULL,
  `req_labour` int(11) DEFAULT NULL,
  `est_job_duration` int(11) DEFAULT NULL,
  `est_cost` int(11) DEFAULT NULL,
  `comments` varchar(50) DEFAULT NULL,
  KEY `ibfk_1` (`site_no_fk`),
  KEY `ibfk_2` (`z_id_fk`),
  KEY `ibfk_3` (`s_id_fk`),
  CONSTRAINT `ibfk_1` FOREIGN KEY (`site_no_fk`) REFERENCES `site` (`site_no`),
  CONSTRAINT `ibfk_2` FOREIGN KEY (`z_id_fk`) REFERENCES `zonal_officer` (`z_id`),
  CONSTRAINT `ibfk_3` FOREIGN KEY (`s_id_fk`) REFERENCES `surveyor` (`s_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surveys`
--

LOCK TABLES `surveys` WRITE;
/*!40000 ALTER TABLE `surveys` DISABLE KEYS */;
INSERT INTO `surveys` VALUES (67,'SR002','ZOF001',2500,40,41,60000,'Weed Remover needed'),(85,'SR001','ZOF001',8323,20,51,98000,'Detoxication chemicals'),(85,'SR001','ZOF001',12312,12,15,70000,'grass cutter'),(65,'SR001','ZOF001',42221,32,21,120,'fhisgks'),(85,'SR001','ZOF001',13453,12,31,42000,'positive cutter machine');
/*!40000 ALTER TABLE `surveys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zonal_officer`
--

DROP TABLE IF EXISTS `zonal_officer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `zonal_officer` (
  `f_name` varchar(10) DEFAULT NULL,
  `m_name` varchar(10) DEFAULT NULL,
  `l_name` varchar(10) DEFAULT NULL,
  `email_id` varchar(30) DEFAULT NULL,
  `DOB` date DEFAULT NULL,
  `gender` char(1) DEFAULT 'M',
  `z_id` varchar(10) NOT NULL,
  `uname` varchar(45) DEFAULT NULL,
  `pass` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`z_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zonal_officer`
--

LOCK TABLES `zonal_officer` WRITE;
/*!40000 ALTER TABLE `zonal_officer` DISABLE KEYS */;
INSERT INTO `zonal_officer` VALUES ('tejas','d','abhang','te@gmail.com','0501-12-22','M','ZOF001','ad001','pass');
/*!40000 ALTER TABLE `zonal_officer` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tg_zonal_id` BEFORE INSERT ON `zonal_officer` FOR EACH ROW begin
insert into zonal_seq values (null);
set new.z_id = concat('ZOF',lpad(last_insert_id(),3,'0'));
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `zonal_seq`
--

DROP TABLE IF EXISTS `zonal_seq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `zonal_seq` (
  `ad_id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`ad_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zonal_seq`
--

LOCK TABLES `zonal_seq` WRITE;
/*!40000 ALTER TABLE `zonal_seq` DISABLE KEYS */;
INSERT INTO `zonal_seq` VALUES (1);
/*!40000 ALTER TABLE `zonal_seq` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-10-24 11:09:02
