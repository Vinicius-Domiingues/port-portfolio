CREATE TABLE usuarios (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(150) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE,
 senha VARCHAR(255) NOT NULL, criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
 role VARCHAR(50) DEFAULT 'produtor'
) ENGINE=InnoDB;
CREATE TABLE concursos (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(255) NOT NULL,
 ano INT NOT NULL, status ENUM('Aberto','Fechado') DEFAULT 'Aberto',
 data_criacao TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE amostras (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, concurso_id INT DEFAULT 1,
 codigo_amostra VARCHAR(50) NOT NULL, nome_produtor VARCHAR(255), municipio VARCHAR(100),
 nome_propriedade VARCHAR(255), categoria VARCHAR(50), cultivar VARCHAR(100),
 altitude_media INT, altitude_maxima INT, idade INT, telefone VARCHAR(20), email VARCHAR(255),
 uso_terra VARCHAR(50), area_cafe DECIMAL(10,2), area_total DECIMAL(10,2),
 participa_associacao VARCHAR(100), num_pes INT, producao_sacas INT, coordenadas VARCHAR(100),
 assistencia_tecnica VARCHAR(20), certificacoes VARCHAR(255), perfil_sensorial VARCHAR(500),
 nota_final DECIMAL(5,2), data_cadastro TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
 genero VARCHAR(50), quantidade_sacas INT, arquivo_laudo VARCHAR(255)
) ENGINE=InnoDB;
CREATE TABLE solicitacoes_selos (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, amostra_id INT NOT NULL,
 status VARCHAR(50) DEFAULT 'Pendente', data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (amostra_id) REFERENCES amostras(id) ON DELETE CASCADE
) ENGINE=InnoDB;
