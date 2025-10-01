package services

type postsSyncService struct{}

type postsSyncServiceInterface interface {
	CreateVector() error
	GetSimilarPets() error
}

var (
	PostsSyncService postsSyncServiceInterface
)

func init() {
	PostsSyncService = &postsSyncService{}
}

func (s *postsSyncService) CreateVector() error {

	return nil
}

func (s *postsSyncService) GetSimilarPets() error {
	return nil
}
