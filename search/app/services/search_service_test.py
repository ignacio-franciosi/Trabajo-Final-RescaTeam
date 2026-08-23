import pytest
from unittest.mock import Mock
import numpy as np
from PIL import Image

from app.services.search_service import SearchService
from app.dto.dtos import CreateEmbeddingDto, SearchPetDto


class TestSearchService:
    """Unit tests for SearchService"""

    @pytest.mark.asyncio
    async def test_create_vector_success(self):
        """Test successful vector creation"""
        # Arrange
        mock_ai_client = Mock()
        mock_vector = np.array([0.1, 0.2, 0.3, 0.4])
        mock_ai_client.generate_embedding.return_value = mock_vector
        
        mock_image = Image.new('RGB', (100, 100))
        mock_image_repo = Mock()
        mock_image_repo.load_image.return_value = mock_image
        
        mock_vector_repo = Mock()
        expected_qdrant_id = "test-uuid-123"
        mock_vector_repo.save_embedding.return_value = expected_qdrant_id
        
        service = SearchService(
            ai_client=mock_ai_client,
            vector_repo=mock_vector_repo,
            image_repo=mock_image_repo
        )
        
        request = CreateEmbeddingDto(
            post_id="post-123",
            post_type="lost",
            image_url="https://bucket.s3.amazonaws.com/adoption-images/test.jpg",
            species="perro"
        )
        
        # Act
        result = await service.create_vector(request)
        
        # Assert
        assert result == expected_qdrant_id
        mock_image_repo.load_image.assert_called_once_with(request.image_url)
        mock_ai_client.generate_embedding.assert_called_once_with(mock_image)
        mock_vector_repo.save_embedding.assert_called_once_with(
            request=request,
            vector=mock_vector
        )

    @pytest.mark.asyncio
    async def test_create_vector_s3_error(self):
        """Test create_vector when S3 fails to load image"""
        # Arrange
        mock_ai_client = Mock()
        mock_image_repo = Mock()
        mock_image_repo.load_image.side_effect = Exception("S3 connection error")
        mock_vector_repo = Mock()
        
        service = SearchService(
            ai_client=mock_ai_client,
            vector_repo=mock_vector_repo,
            image_repo=mock_image_repo
        )
        
        request = CreateEmbeddingDto(
            post_id="post-123",
            post_type="lost",
            image_url="https://bucket.s3.amazonaws.com/adoption-images/test.jpg",
            species="perro"
        )
        
        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            await service.create_vector(request)
        
        assert "S3 connection error" in str(exc_info.value)
        mock_image_repo.load_image.assert_called_once_with(request.image_url)
        mock_ai_client.generate_embedding.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_vector_ai_model_error(self):
        """Test create_vector when AI model fails to generate embedding"""
        # Arrange
        mock_ai_client = Mock()
        mock_ai_client.generate_embedding.side_effect = Exception("Model error")
        
        mock_image = Image.new('RGB', (100, 100))
        mock_image_repo = Mock()
        mock_image_repo.load_image.return_value = mock_image
        mock_vector_repo = Mock()
        
        service = SearchService(
            ai_client=mock_ai_client,
            vector_repo=mock_vector_repo,
            image_repo=mock_image_repo
        )
        
        request = CreateEmbeddingDto(
            post_id="post-123",
            post_type="found",
            image_url="https://bucket.s3.amazonaws.com/adoption-images/test.jpg",
            species="gato"
        )
        
        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            await service.create_vector(request)
        
        assert "Model error" in str(exc_info.value)
        mock_image_repo.load_image.assert_called_once_with(request.image_url)
        mock_ai_client.generate_embedding.assert_called_once_with(mock_image)
        mock_vector_repo.save_embedding.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_vector_qdrant_error(self):
        """Test create_vector when Qdrant fails to save embedding"""
        # Arrange
        mock_ai_client = Mock()
        mock_vector = np.array([0.1, 0.2, 0.3])
        mock_ai_client.generate_embedding.return_value = mock_vector
        
        mock_image = Image.new('RGB', (100, 100))
        mock_image_repo = Mock()
        mock_image_repo.load_image.return_value = mock_image
        
        mock_vector_repo = Mock()
        mock_vector_repo.save_embedding.side_effect = Exception("Qdrant connection error")
        
        service = SearchService(
            ai_client=mock_ai_client,
            vector_repo=mock_vector_repo,
            image_repo=mock_image_repo
        )
        
        request = CreateEmbeddingDto(
            post_id="post-123",
            post_type="lost",
            image_url="https://bucket.s3.amazonaws.com/adoption-images/test.jpg",
            species="perro"
        )
        
        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            await service.create_vector(request)
        
        assert "Qdrant connection error" in str(exc_info.value)
        mock_image_repo.load_image.assert_called_once_with(request.image_url)
        mock_ai_client.generate_embedding.assert_called_once_with(mock_image)
        mock_vector_repo.save_embedding.assert_called_once_with(
            request=request,
            vector=mock_vector
        )

    @pytest.mark.asyncio
    async def test_search_vector_success_with_results(self):
        """Test successful search with results"""
        # Arrange
        mock_result_1 = Mock()
        mock_result_1.payload = {"post_id": "post-456"}
        
        mock_result_2 = Mock()
        mock_result_2.payload = {"post_id": "post-789"}
        
        mock_vector_repo = Mock()
        mock_vector_repo.search_embedding.return_value = [mock_result_1, mock_result_2]
        
        service = SearchService(
            ai_client=Mock(),
            vector_repo=mock_vector_repo,
            image_repo=Mock()
        )
        
        request = SearchPetDto(
            post_id="post-123",
            post_type="lost",
            species="perro"
        )
        
        # Act
        result = await service.search_vector(request)
        
        # Assert
        assert result == ["post-456", "post-789"]
        assert len(result) == 2
        mock_vector_repo.search_embedding.assert_called_once_with(request)

    @pytest.mark.asyncio
    async def test_search_vector_empty_results(self):
        """Test search when no similar pets are found"""
        # Arrange
        mock_vector_repo = Mock()
        mock_vector_repo.search_embedding.return_value = []
        
        service = SearchService(
            ai_client=Mock(),
            vector_repo=mock_vector_repo,
            image_repo=Mock()
        )
        
        request = SearchPetDto(
            post_id="post-123",
            post_type="found",
            species="gato"
        )
        
        # Act
        result = await service.search_vector(request)
        
        # Assert
        assert result == []
        assert len(result) == 0
        mock_vector_repo.search_embedding.assert_called_once_with(request)

    @pytest.mark.asyncio
    async def test_search_vector_single_result(self):
        """Test search with single result"""
        # Arrange
        mock_result = Mock()
        mock_result.payload = {"post_id": "post-999"}
        
        mock_vector_repo = Mock()
        mock_vector_repo.search_embedding.return_value = [mock_result]
        
        service = SearchService(
            ai_client=Mock(),
            vector_repo=mock_vector_repo,
            image_repo=Mock()
        )
        
        request = SearchPetDto(
            post_id="post-123",
            post_type="lost",
            species="perro"
        )
        
        # Act
        result = await service.search_vector(request)
        
        # Assert
        assert result == ["post-999"]
        assert len(result) == 1
        mock_vector_repo.search_embedding.assert_called_once_with(request)

    @pytest.mark.asyncio
    async def test_search_vector_missing_post_id_in_payload(self):
        """Test search when result payload doesn't have post_id"""
        # Arrange
        mock_result_1 = Mock()
        mock_result_1.payload = {"post_id": "post-456"}
        
        mock_result_2 = Mock()
        mock_result_2.payload = {}  # Missing post_id
        
        mock_result_3 = Mock()
        mock_result_3.payload = {"post_id": "post-789"}
        
        mock_vector_repo = Mock()
        mock_vector_repo.search_embedding.return_value = [
            mock_result_1, 
            mock_result_2, 
            mock_result_3
        ]
        
        service = SearchService(
            ai_client=Mock(),
            vector_repo=mock_vector_repo,
            image_repo=Mock()
        )
        
        request = SearchPetDto(
            post_id="post-123",
            post_type="found",
            species="gato"
        )
        
        # Act
        result = await service.search_vector(request)
        
        # Assert
        # Should include None for missing post_id (since .get() returns None for missing keys)
        assert len(result) == 3
        assert "post-456" in result
        assert "post-789" in result
        assert None in result
        mock_vector_repo.search_embedding.assert_called_once_with(request)

    @pytest.mark.asyncio
    async def test_search_vector_qdrant_error(self):
        """Test search when Qdrant fails"""
        # Arrange
        mock_vector_repo = Mock()
        mock_vector_repo.search_embedding.side_effect = Exception("Qdrant search error")
        
        service = SearchService(
            ai_client=Mock(),
            vector_repo=mock_vector_repo,
            image_repo=Mock()
        )
        
        request = SearchPetDto(
            post_id="post-123",
            post_type="lost",
            species="perro"
        )
        
        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            await service.search_vector(request)
        
        assert "Qdrant search error" in str(exc_info.value)
        mock_vector_repo.search_embedding.assert_called_once_with(request)

    @pytest.mark.asyncio
    async def test_search_vector_different_post_types(self):
        """Test search with different post types (lost vs found)"""
        # Arrange
        mock_result = Mock()
        mock_result.payload = {"post_id": "post-456"}
        
        mock_vector_repo = Mock()
        mock_vector_repo.search_embedding.return_value = [mock_result]
        
        service = SearchService(
            ai_client=Mock(),
            vector_repo=mock_vector_repo,
            image_repo=Mock()
        )
        
        # Test with "lost" post type
        request_lost = SearchPetDto(
            post_id="post-123",
            post_type="lost",
            species="perro"
        )
        
        # Act
        result_lost = await service.search_vector(request_lost)
        
        # Assert
        assert result_lost == ["post-456"]
        mock_vector_repo.search_embedding.assert_called_with(request_lost)
        
        # Test with "found" post type
        request_found = SearchPetDto(
            post_id="post-123",
            post_type="found",
            species="gato"
        )
        
        result_found = await service.search_vector(request_found)
        
        # Assert
        assert result_found == ["post-456"]
        assert mock_vector_repo.search_embedding.call_count == 2

    @pytest.mark.asyncio
    async def test_create_vector_with_different_post_types(self):
        """Test create_vector with both 'lost' and 'found' post types"""
        # Arrange
        mock_ai_client = Mock()
        mock_vector = np.array([0.1, 0.2, 0.3])
        mock_ai_client.generate_embedding.return_value = mock_vector
        
        mock_image = Image.new('RGB', (100, 100))
        mock_image_repo = Mock()
        mock_image_repo.load_image.return_value = mock_image
        
        mock_vector_repo = Mock()
        expected_qdrant_id = "test-uuid-456"
        mock_vector_repo.save_embedding.return_value = expected_qdrant_id
        
        service = SearchService(
            ai_client=mock_ai_client,
            vector_repo=mock_vector_repo,
            image_repo=mock_image_repo
        )
        
        # Test with "lost" post type
        request_lost = CreateEmbeddingDto(
            post_id="post-123",
            post_type="lost",
            image_url="https://bucket.s3.amazonaws.com/adoption-images/test.jpg",
            species="perro"
        )
        
        result_lost = await service.create_vector(request_lost)
        assert result_lost == expected_qdrant_id
        
        # Test with "found" post type
        request_found = CreateEmbeddingDto(
            post_id="post-456",
            post_type="found",
            image_url="https://bucket.s3.amazonaws.com/adoption-images/test2.jpg",
            species="gato"
        )
        
        expected_qdrant_id_found = "test-uuid-789"
        mock_vector_repo.save_embedding.return_value = expected_qdrant_id_found
        
        result_found = await service.create_vector(request_found)
        assert result_found == expected_qdrant_id_found
        
        # Assert both calls were made
        assert mock_image_repo.load_image.call_count == 2
        assert mock_ai_client.generate_embedding.call_count == 2
        assert mock_vector_repo.save_embedding.call_count == 2

    @pytest.mark.asyncio
    async def test_search_vector_large_result_set(self):
        """Test search with a large number of results"""
        # Arrange
        num_results = 100
        mock_results = []
        for i in range(num_results):
            mock_result = Mock()
            mock_result.payload = {"post_id": f"post-{i}"}
            mock_results.append(mock_result)
        
        mock_vector_repo = Mock()
        mock_vector_repo.search_embedding.return_value = mock_results
        
        service = SearchService(
            ai_client=Mock(),
            vector_repo=mock_vector_repo,
            image_repo=Mock()
        )
        
        request = SearchPetDto(
            post_id="post-123",
            post_type="lost",
            species="perro"
        )
        
        # Act
        result = await service.search_vector(request)
        
        # Assert
        assert len(result) == num_results
        assert result[0] == "post-0"
        assert result[-1] == f"post-{num_results-1}"
        mock_vector_repo.search_embedding.assert_called_once_with(request)
