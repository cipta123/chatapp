-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 13, 2025 at 06:00 AM
-- Server version: 10.4.25-MariaDB
-- PHP Version: 7.4.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `student_chat_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`id`, `created_at`, `updated_at`) VALUES
(1, '2025-01-09 12:19:48', '2025-01-10 08:27:33'),
(2, '2025-01-09 15:50:37', '2025-01-10 05:52:03'),
(3, '2025-01-10 06:08:22', '2025-01-10 06:08:22'),
(4, '2025-01-13 04:20:55', '2025-01-13 04:25:05');

-- --------------------------------------------------------

--
-- Stand-in structure for view `conversation_messages_view`
-- (See below for the actual view)
--
CREATE TABLE `conversation_messages_view` (
`id` int(11)
,`conversation_id` int(11)
,`message_text` text
,`created_at` timestamp
,`is_deleted` tinyint(1)
,`sender_nim` varchar(20)
,`sender_name` varchar(100)
);

-- --------------------------------------------------------

--
-- Table structure for table `conversation_participants`
--

CREATE TABLE `conversation_participants` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_read_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `conversation_participants`
--

INSERT INTO `conversation_participants` (`id`, `conversation_id`, `student_id`, `joined_at`, `last_read_at`) VALUES
(8, 1, 1, '2025-01-10 06:08:22', '2025-01-10 06:08:22'),
(9, 1, 2, '2025-01-10 06:08:22', '2025-01-10 06:08:22'),
(10, 4, 1, '2025-01-13 04:20:55', '2025-01-13 04:20:55'),
(11, 4, 3, '2025-01-13 04:20:55', '2025-01-13 04:20:55');

-- --------------------------------------------------------

--
-- Table structure for table `friend_requests`
--

CREATE TABLE `friend_requests` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `friend_requests`
--

INSERT INTO `friend_requests` (`id`, `sender_id`, `receiver_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 3, 'accepted', '2025-01-13 02:40:01', '2025-01-13 04:20:55');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `message_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `message_text`, `created_at`, `updated_at`, `is_deleted`) VALUES
(32, 1, 1, 'hallo', '2025-01-09 16:59:17', '2025-01-09 16:59:17', 0),
(33, 1, 1, 'ada apa sis', '2025-01-10 05:49:58', '2025-01-10 05:49:58', 0),
(34, 2, 1, 'adsdd', '2025-01-10 05:51:16', '2025-01-10 05:51:16', 0),
(35, 2, 2, 'APT', '2025-01-10 05:52:03', '2025-01-10 05:52:03', 0),
(36, 3, 1, 'Hi Cipta, how are you?', '2025-01-10 06:08:22', '2025-01-10 06:08:22', 0),
(37, 3, 1, 'Great! Do you want to work on the project together?', '2025-01-10 06:08:22', '2025-01-10 06:08:22', 0),
(38, 1, 2, 'yoooo', '2025-01-10 06:09:19', '2025-01-10 06:09:19', 0),
(39, 1, 2, 'ya yo ya yo', '2025-01-10 06:09:33', '2025-01-10 06:09:33', 0),
(40, 1, 2, 'sdafas', '2025-01-10 06:09:41', '2025-01-10 06:09:41', 0),
(41, 1, 2, 'dsfaf', '2025-01-10 06:10:24', '2025-01-10 06:10:24', 0),
(42, 1, 2, 'jjjj', '2025-01-10 06:12:39', '2025-01-10 06:12:39', 0),
(43, 1, 2, 'http://localhost/LoginApp/api/check_users.php', '2025-01-10 06:12:59', '2025-01-10 06:12:59', 0),
(44, 1, 2, 'aaaa', '2025-01-10 06:14:25', '2025-01-10 06:14:25', 0),
(45, 1, 2, 'aaaa', '2025-01-10 06:14:48', '2025-01-10 06:14:48', 0),
(46, 1, 2, 'dddd', '2025-01-10 06:14:51', '2025-01-10 06:14:51', 0),
(47, 1, 2, 'lalalala', '2025-01-10 08:26:20', '2025-01-10 08:26:20', 0),
(48, 1, 1, 'dsfafasd', '2025-01-10 08:26:40', '2025-01-10 08:26:40', 0),
(49, 1, 2, 'ngomgng apa sih lu', '2025-01-10 08:27:06', '2025-01-10 08:27:06', 0),
(50, 1, 1, 'apa aj juga boleeh', '2025-01-10 08:27:33', '2025-01-10 08:27:33', 0),
(51, 4, 1, 'hallo', '2025-01-13 04:24:41', '2025-01-13 04:24:41', 0),
(52, 4, 3, 'ehh iya naaa, apa kabar', '2025-01-13 04:25:05', '2025-01-13 04:25:05', 0);

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `nim` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `birthday` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `nim`, `name`, `birthday`, `created_at`) VALUES
(1, '12345', 'nana suryana', '2000-01-01', '2025-01-09 04:03:06'),
(2, '67890', 'cipta anugrah', '2000-05-15', '2025-01-09 04:03:06'),
(3, '11221', 'ade irawan', '2015-01-01', '2025-01-13 02:35:11');

-- --------------------------------------------------------

--
-- Structure for view `conversation_messages_view`
--
DROP TABLE IF EXISTS `conversation_messages_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `conversation_messages_view`  AS SELECT `m`.`id` AS `id`, `m`.`conversation_id` AS `conversation_id`, `m`.`message_text` AS `message_text`, `m`.`created_at` AS `created_at`, `m`.`is_deleted` AS `is_deleted`, `s`.`nim` AS `sender_nim`, `s`.`name` AS `sender_name` FROM (`messages` `m` join `students` `s` on(`m`.`sender_id` = `s`.`id`)) WHERE `m`.`is_deleted` = 0 ORDER BY `m`.`created_at` AS `DESCdesc` ASC  ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_conversation_participant` (`conversation_id`,`student_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `friend_requests`
--
ALTER TABLE `friend_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_request` (`sender_id`,`receiver_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nim` (`nim`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `friend_requests`
--
ALTER TABLE `friend_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  ADD CONSTRAINT `conversation_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`),
  ADD CONSTRAINT `conversation_participants_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`);

--
-- Constraints for table `friend_requests`
--
ALTER TABLE `friend_requests`
  ADD CONSTRAINT `friend_requests_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `students` (`id`),
  ADD CONSTRAINT `friend_requests_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `students` (`id`);

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `students` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
